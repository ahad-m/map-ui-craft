"""
محرك البحث الهجين (Exact + Vector Similarity)
النسخة النهائية - مع البحث الدلالي الكامل
"""
from models import PropertyCriteria, Property, SearchMode
from database import db
from config import settings
from typing import List, Optional, Dict, Any
import logging
from embedding_generator import embedding_generator
from arabic_utils import normalize_arabic_text, calculate_similarity_score

logger = logging.getLogger(__name__)


def _minutes_to_meters(minutes: float, avg_speed_kmh: float = 30.0, walking: bool = False) -> float:
    """تحويل وقت القيادة/المشي بالدقائق إلى مسافة بالأمتار"""
    if minutes <= 0:
        return 0
    
    if walking:
        avg_speed_kmh = 5.0
    
    distance_km = avg_speed_kmh * (minutes / 60.0)
    return distance_km * 1000


LEVELS_TRANSLATION_MAP = {
    "ابتدائي": "elementary",
    "متوسط": "middle",
    "ثانوي": "high",
    "روضة": "kindergarten",
    "حضانة": "nursery"
}


def _find_matching_university(query_name: str, threshold: float = 0.5) -> Optional[str]:
    """البحث عن أفضل تطابق لاسم الجامعة من قاعدة البيانات"""
    if not query_name:
        return None
    
    try:
        result = db.client.table('universities').select('name_ar, name_en').execute()
        
        if not result.data:
            logger.warning("لا توجد جامعات في قاعدة البيانات")
            return None
        
        all_names = []
        for uni in result.data:
            if uni.get('name_ar'):
                all_names.append(uni['name_ar'])
            if uni.get('name_en'):
                all_names.append(uni['name_en'])
        
        best_match = None
        best_score = 0.0
        
        for name in all_names:
            score = calculate_similarity_score(query_name, name)
            if score > best_score and score >= threshold:
                best_score = score
                best_match = name
        
        if best_match:
            logger.info(f"تطابق غامض: '{query_name}' → '{best_match}' (نقاط: {best_score:.2f})")
        else:
            logger.warning(f"لم يُعثر على تطابق جيد للجامعة: '{query_name}'")
        
        return best_match
        
    except Exception as e:
        logger.error(f"خطأ في البحث الغامض عن الجامعة: {e}")
        return None


def _get_nearby_universities_for_display(
    center_lat: float,
    center_lon: float,
    max_distance_meters: float,
    university_name: Optional[str] = None
) -> List[Dict[str, Any]]:
    """جلب قائمة الجامعات القريبة من نقطة مركزية لعرضها على الخريطة"""
    try:
        result = db.client.rpc(
            'get_universities_for_display',
            {
                'center_lat': center_lat,
                'center_lon': center_lon,
                'max_distance_meters': max_distance_meters,
                'university_name': university_name
            }
        ).execute()
        
        if not result.data:
            return []
        
        universities = []
        for uni in result.data:
            uni_dict = dict(uni)
            distance_meters = uni_dict.get('distance_meters', 0)
            drive_minutes = (distance_meters / 1000.0) / 30.0 * 60.0
            uni_dict['drive_minutes'] = round(drive_minutes, 1)
            universities.append(uni_dict)
        
        logger.info(f"تم جلب {len(universities)} جامعة للعرض")
        return universities
        
    except Exception as e:
        logger.error(f"خطأ في جلب الجامعات للعرض: {e}")
        return []


def _get_nearby_mosques_for_display(
    center_lat: float,
    center_lon: float,
    max_distance_meters: float,
    mosque_name: Optional[str] = None
) -> List[Dict[str, Any]]:
    """جلب قائمة المساجد القريبة من نقطة مركزية لعرضها على الخريطة"""
    try:
        result = db.client.rpc(
            'get_mosques_for_display',
            {
                'center_lat': center_lat,
                'center_lon': center_lon,
                'max_distance_meters': max_distance_meters,
                'mosque_name': mosque_name
            }
        ).execute()
        
        if not result.data:
            return []
        
        mosques = []
        for mosque in result.data:
            mosque_dict = dict(mosque)
            distance_meters = mosque_dict.get('distance_meters', 0)
            walk_minutes = (distance_meters / 1000.0) / 5.0 * 60.0
            mosque_dict['walk_minutes'] = round(walk_minutes, 1)
            mosques.append(mosque_dict)
        
        logger.info(f"تم جلب {len(mosques)} مسجد للعرض")
        return mosques
        
    except Exception as e:
        logger.error(f"خطأ في جلب المساجد للعرض: {e}")
        return []


class SearchEngine:
    """محرك البحث الهجين للعقارات"""
    
    def __init__(self):
        """تهيئة محرك البحث"""
        self.db = db
        self.exact_limit = settings.EXACT_SEARCH_LIMIT
        self.hybrid_limit = settings.HYBRID_SEARCH_LIMIT
        self.sql_weight = settings.SQL_WEIGHT
        self.vector_weight = settings.VECTOR_WEIGHT
    
    def _get_nearby_universities(self, center_lat: float, center_lon: float, max_distance_meters: float, university_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """جلب الجامعات القريبة"""
        return _get_nearby_universities_for_display(center_lat, center_lon, max_distance_meters, university_name)
    
    def _get_nearby_mosques(self, center_lat: float, center_lon: float, max_distance_meters: float, mosque_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """جلب المساجد القريبة"""
        return _get_nearby_mosques_for_display(center_lat, center_lon, max_distance_meters, mosque_name)
    
    def search(self, criteria: PropertyCriteria, mode: SearchMode) -> List[Property]:
        """البحث عن العقارات بناءً على المعايير ونوع البحث"""
        try:
            if mode == SearchMode.EXACT:
                return self._exact_search(criteria)
            else:
                return self._hybrid_search(criteria)
        except Exception as e:
            logger.error(f"خطأ في البحث: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _exact_search(self, criteria: PropertyCriteria) -> List[Property]:
        """البحث الدقيق - يطابق جميع المعايير بالضبط"""
        try:
            query = self.db.client.table('properties').select('*')
            
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            if criteria.city:
                query = query.eq('city', criteria.city)
            
            if criteria.district:
                query = query.eq('district', criteria.district)
            
            if criteria.rooms:
                query = query.eq('rooms', criteria.rooms)
            
            if criteria.baths:
                query = query.eq('baths', criteria.baths)
            
            if criteria.halls:
                query = query.eq('halls', criteria.halls)
            
            if criteria.price:
                if criteria.price.min:
                    query = query.gte('price_num', criteria.price.min)
                if criteria.price.max:
                    query = query.lte('price_num', criteria.price.max)
            
            if criteria.area_m2:
                if criteria.area_m2.min:
                    query = query.gte('area_m2', criteria.area_m2.min)
                if criteria.area_m2.max:
                    query = query.lte('area_m2', criteria.area_m2.max)
            
            result = query.order('price_num').limit(self.exact_limit).execute()
            
            if not result.data:
                logger.info("البحث الدقيق: لم يُعثر على عقارات")
                return []
            
            properties = [self._row_to_property(row) for row in result.data]
            
            # إضافة الخدمات القريبة
            if properties:
                self._add_nearby_services(properties, criteria)
            
            logger.info(f"البحث الدقيق: وجد {len(properties)} عقار")
            return properties
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدقيق: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _hybrid_search(self, criteria: PropertyCriteria) -> List[Property]:
        """البحث الهجين - يجمع بين البحث SQL والبحث الدلالي"""
        try:
            # المرحلة 1: البحث SQL مع توسيع النطاقات
            sql_results = self._flexible_sql_search(criteria)
            logger.info(f"📊 البحث SQL: وجد {len(sql_results)} عقار")
            
            # المرحلة 2: البحث الدلالي (Vector Similarity)
            vector_results = []
            if criteria.original_query:
                vector_results = self._vector_search(criteria.original_query)
                logger.info(f"🔍 البحث الدلالي: وجد {len(vector_results)} عقار")
            
            # المرحلة 3: دمج النتائج وإعادة الترتيب
            merged_results = self._merge_and_rerank(sql_results, vector_results, criteria)
            
            # [مُحسّن] فلترة النتائج بناءً على القرب من الخدمات
            if merged_results:
                filtered_results = self._filter_by_services(merged_results, criteria)
                
                if not filtered_results:
                    logger.warning("⚠️ لا توجد عقارات قريبة من الخدمات المطلوبة، إرجاع بعض النتائج")
                    filtered_results = merged_results[:10]
                
                # إضافة الخدمات القريبة للعرض
                self._add_nearby_services(filtered_results, criteria)
                
                logger.info(f"✅ البحث الهجين: وجد {len(filtered_results)} عقار نهائي")
                return filtered_results[:self.hybrid_limit]
            
            return []
            
        except Exception as e:
            logger.error(f"❌ خطأ في البحث الهجين: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _flexible_sql_search(self, criteria: PropertyCriteria) -> List[Dict[str, Any]]:
        """بحث SQL مرن - يوسع نطاقات البحث"""
        try:
            query = self.db.client.table('properties').select('*')
            
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            # الشروط الإلزامية
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            # فلترة المدينة (إلزامية إذا كانت موجودة)
            if criteria.city:
                query = query.eq('city', criteria.city)
            
            # توسيع نطاق السعر (±30%)
            if criteria.price and criteria.price.max:
                expanded_max = criteria.price.max * 1.3
                query = query.lte('price_num', expanded_max)
            
            # توسيع نطاق المساحة (±20%)
            if criteria.area_m2:
                if criteria.area_m2.min:
                    query = query.gte('area_m2', criteria.area_m2.min * 0.8)
                if criteria.area_m2.max:
                    query = query.lte('area_m2', criteria.area_m2.max * 1.2)
            
            result = query.order('price_num').limit(200).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"خطأ في البحث SQL المرن: {e}")
            return []
    
    def _vector_search(self, query_text: str) -> List[Dict[str, Any]]:
        """البحث الدلالي باستخدام Embeddings"""
        try:
            # توليد embedding للطلب
            query_embedding = embedding_generator.generate(query_text)
            
            if not query_embedding:
                logger.warning("فشل توليد embedding للطلب")
                return []
            
            # البحث في Supabase باستخدام match_documents
            result = self.db.client.rpc(
                'match_documents',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.5,  # خفضنا الحد الأدنى لزيادة النتائج
                    'match_count': 100  # زيادة عدد النتائج
                }
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدلالي: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _merge_and_rerank(
        self,
        sql_results: List[Dict[str, Any]],
        vector_results: List[Dict[str, Any]],
        criteria: PropertyCriteria
    ) -> List[Property]:
        """دمج نتائج البحث SQL والدلالي وإعادة ترتيبها"""
        merged = {}
        
        # إضافة نتائج SQL
        for row in sql_results:
            prop_id = row['id']
            merged[prop_id] = {
                'data': row,
                'sql_score': self.sql_weight,
                'vector_score': 0
            }
        
        # إضافة نتائج Vector
        for row in vector_results:
            prop_id = row['id']
            similarity = row.get('similarity', 0)
            
            if prop_id in merged:
                merged[prop_id]['vector_score'] = similarity * self.vector_weight
            else:
                merged[prop_id] = {
                    'data': row,
                    'sql_score': 0,
                    'vector_score': similarity * self.vector_weight
                }
        
        # حساب النقاط النهائية وترتيب النتائج
        ranked_properties = []
        for prop_id, item in merged.items():
            total_score = item['sql_score'] + item['vector_score']
            prop = self._row_to_property(item['data'])
            prop.match_score = total_score
            ranked_properties.append(prop)
        
        # ترتيب تنازلي حسب النقاط
        ranked_properties.sort(key=lambda x: x.match_score or 0, reverse=True)
        
        return ranked_properties
    
    def _filter_by_services(self, properties: List[Property], criteria: PropertyCriteria) -> List[Property]:
        """فلترة العقارات بناءً على القرب من الخدمات المطلوبة"""
        if not properties:
            return []
        
        # إذا لم يطلب المستخدم أي خدمات، إرجاع جميع العقارات
        has_service_requirements = (
            (criteria.university_requirements and criteria.university_requirements.required) or
            (criteria.mosque_requirements and criteria.mosque_requirements.required) or
            (criteria.school_requirements and criteria.school_requirements.required)
        )
        
        if not has_service_requirements:
            return properties
        
        filtered = []
        
        for prop in properties:
            if not prop.final_lat or not prop.final_lon:
                continue
            
            is_valid = True
            
            # فحص الجامعات
            if criteria.university_requirements and criteria.university_requirements.required:
                uni_reqs = criteria.university_requirements
                max_distance_meters = (uni_reqs.max_distance_minutes or 30) * 60 * 30
                
                try:
                    nearby_unis = self._get_nearby_universities(
                        float(prop.final_lat),
                        float(prop.final_lon),
                        max_distance_meters,
                        uni_reqs.university_name
                    )
                    
                    if not nearby_unis:
                        is_valid = False
                        continue
                        
                except Exception as e:
                    logger.error(f"خطأ في فحص الجامعات: {e}")
                    is_valid = False
                    continue
            
            # فحص المساجد
            if criteria.mosque_requirements and criteria.mosque_requirements.required:
                mosque_reqs = criteria.mosque_requirements
                speed_kmh = 5 if mosque_reqs.walking else 30
                max_distance_meters = (mosque_reqs.max_distance_minutes or 10) * 60 * speed_kmh
                
                try:
                    nearby_mosques = self._get_nearby_mosques(
                        float(prop.final_lat),
                        float(prop.final_lon),
                        max_distance_meters,
                        mosque_reqs.mosque_name
                    )
                    
                    if not nearby_mosques:
                        is_valid = False
                        continue
                        
                except Exception as e:
                    logger.error(f"خطأ في فحص المساجد: {e}")
                    is_valid = False
                    continue
            
            # فحص المدارس
            if criteria.school_requirements and criteria.school_requirements.required:
                school_reqs = criteria.school_requirements
                speed_kmh = 5 if school_reqs.walking else 30
                max_distance_meters = (school_reqs.max_distance_minutes or 15) * 60 * speed_kmh
                
                try:
                    levels = [LEVELS_TRANSLATION_MAP.get(lvl, lvl) for lvl in (school_reqs.levels or [])]
                    
                    result = db.client.rpc(
                        'get_nearby_schools',
                        {
                            'p_lat': float(prop.final_lat),
                            'p_lon': float(prop.final_lon),
                            'p_distance_meters': max_distance_meters,
                            'p_gender': school_reqs.gender,
                            'p_levels': levels
                        }
                    ).execute()
                    
                    if not result.data:
                        is_valid = False
                        continue
                        
                except Exception as e:
                    logger.error(f"خطأ في فحص المدارس: {e}")
                    is_valid = False
                    continue
            
            if is_valid:
                filtered.append(prop)
        
        return filtered
    
    def _add_nearby_services(self, properties: List[Property], criteria: PropertyCriteria):
        """إضافة الخدمات القريبة لكل عقار للعرض على الخريطة"""
        if not properties:
            return
        
        first_prop = properties[0]
        if not first_prop.final_lat or not first_prop.final_lon:
            return
        
        try:
            # إضافة الجامعات
            if criteria.university_requirements and criteria.university_requirements.required:
                uni_reqs = criteria.university_requirements
                max_distance_meters = (uni_reqs.max_distance_minutes or 30) * 60 * 30
                
                nearby_universities = self._get_nearby_universities(
                    float(first_prop.final_lat),
                    float(first_prop.final_lon),
                    max_distance_meters,
                    uni_reqs.university_name
                )
                
                logger.info(f"🎓 تم جلب {len(nearby_universities)} جامعة قريبة للعرض")
                
                for prop in properties:
                    prop.nearby_universities = nearby_universities
            
            # إضافة المساجد
            if criteria.mosque_requirements and criteria.mosque_requirements.required:
                mosque_reqs = criteria.mosque_requirements
                speed_kmh = 5 if mosque_reqs.walking else 30
                max_distance_meters = (mosque_reqs.max_distance_minutes or 10) * 60 * speed_kmh
                
                nearby_mosques = self._get_nearby_mosques(
                    float(first_prop.final_lat),
                    float(first_prop.final_lon),
                    max_distance_meters,
                    mosque_reqs.mosque_name
                )
                
                logger.info(f"🕌 تم جلب {len(nearby_mosques)} مسجد قريب للعرض")
                
                for prop in properties:
                    prop.nearby_mosques = nearby_mosques
                    
        except Exception as e:
            logger.error(f"خطأ في إضافة الخدمات: {e}")
    
    def _row_to_property(self, row: Dict[str, Any]) -> Property:
        """تحويل صف من قاعدة البيانات إلى Property object"""
        return Property(
            id=str(row['id']),
            url=row.get('url'),
            purpose=row.get('purpose', ''),
            property_type=row.get('property_type', ''),
            city=row.get('city'),
            district=row.get('district'),
            title=row.get('title'),
            price_num=row.get('price_num'),
            price_currency=row.get('price_currency'),
            price_period=row.get('price_period'),
            area_m2=row.get('area_m2'),
            description=row.get('description'),
            image_url=row.get('image_url'),
            lat=row.get('lat'),
            lon=row.get('lon'),
            final_lat=row.get('final_lat'),
            final_lon=row.get('final_lon'),
            time_to_metro_min=row.get('time_to_metro_min'),
            rooms=row.get('rooms'),
            baths=row.get('baths'),
            halls=row.get('halls'),
            match_score=None,
            nearby_universities=None,
            nearby_mosques=None
        )


# إنشاء instance عام
search_engine = SearchEngine()
