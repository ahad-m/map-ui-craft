"""
محرك البحث الهجين (Exact + Vector Similarity)
النسخة المحدثة - مع دعم المساجد والجامعات وإرجاع بياناتها للواجهة الأمامية
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
    """
    تحويل وقت القيادة/المشي بالدقائق إلى مسافة بالأمتار
    
    Args:
        minutes: الوقت بالدقائق
        avg_speed_kmh: السرعة المتوسطة بالكيلومتر/ساعة (افتراضي: 30 للسيارة)
        walking: True إذا كان المشي (سرعة 5 كم/ساعة)
    
    Returns:
        المسافة بالأمتار
    """
    if minutes <= 0:
        return 0
    
    # تحديد السرعة بناءً على نوع الحركة
    if walking:
        avg_speed_kmh = 5.0  # سرعة المشي: 5 كم/ساعة
    
    # المسافة (كم) = السرعة (كم/ساعة) * (الدقائق / 60)
    distance_km = avg_speed_kmh * (minutes / 60.0)
    
    # تحويل من كم إلى متر
    return distance_km * 1000


LEVELS_TRANSLATION_MAP = {
    "ابتدائي": "elementary",
    "متوسط": "middle",
    "ثانوي": "high",
    "روضة": "kindergarten",
    "حضانة": "nursery"
}


def _find_matching_university(query_name: str, threshold: float = 0.5) -> Optional[str]:
    """
    البحث عن أفضل تطابق لاسم الجامعة من قاعدة البيانات باستخدام Fuzzy Matching
    
    Args:
        query_name: اسم الجامعة من طلب المستخدم (قد يحتوي على اختلافات إملائية)
        threshold: الحد الأدنى لنقاط التشابه (0.0-1.0)، افتراضي 0.5
    
    Returns:
        أفضل اسم مطابق من قاعدة البيانات، أو None إذا لم يوجد تطابق جيد
    """
    if not query_name:
        return None
    
    try:
        # جلب جميع الجامعات من قاعدة البيانات
        result = db.client.table('universities').select('name_ar, name_en').execute()
        
        if not result.data:
            logger.warning("لا توجد جامعات في قاعدة البيانات")
            return None
        
        # جمع جميع أسماء الجامعات (العربية والإنجليزية)
        all_names = []
        for uni in result.data:
            if uni.get('name_ar'):
                all_names.append(uni['name_ar'])
            if uni.get('name_en'):
                all_names.append(uni['name_en'])
        
        # البحث عن أفضل تطابق
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
            logger.warning(f"لم يُعثر على تطابق جيد للجامعة: '{query_name}' (أفضل نقاط: {best_score:.2f})")
        
        return best_match
        
    except Exception as e:
        logger.error(f"خطأ في البحث الغامض عن الجامعة: {e}")
        return None


def _calculate_properties_center(properties: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    """
    حساب النقطة المركزية لمجموعة من العقارات
    
    Args:
        properties: قائمة العقارات
    
    Returns:
        dict مع lat و lon للمركز، أو None إذا لم توجد إحداثيات صالحة
    """
    valid_lats = []
    valid_lons = []
    
    for prop in properties:
        lat = prop.get('final_lat') or prop.get('lat')
        lon = prop.get('final_lon') or prop.get('lon')
        
        if lat and lon:
            try:
                lat_float = float(lat)
                lon_float = float(lon)
                if lat_float != 0 and lon_float != 0:
                    valid_lats.append(lat_float)
                    valid_lons.append(lon_float)
            except (ValueError, TypeError):
                continue
    
    if not valid_lats or not valid_lons:
        return None
    
    return {
        'lat': sum(valid_lats) / len(valid_lats),
        'lon': sum(valid_lons) / len(valid_lons)
    }


def _get_nearby_universities_for_display(
    center_lat: float,
    center_lon: float,
    max_distance_meters: float,
    university_name: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    جلب قائمة الجامعات القريبة من نقطة مركزية لعرضها على الخريطة
    
    Args:
        center_lat: خط العرض للنقطة المركزية
        center_lon: خط الطول للنقطة المركزية
        max_distance_meters: المسافة القصوى بالأمتار
        university_name: اسم الجامعة (اختياري)
    
    Returns:
        قائمة الجامعات مع معلومات المسافة ووقت السفر
    """
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
        
        # إضافة حساب وقت السفر
        universities = []
        for uni in result.data:
            uni_dict = dict(uni)
            # حساب وقت السفر بالدقائق (سرعة 30 كم/س)
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
    """
    جلب قائمة المساجد القريبة من نقطة مركزية لعرضها على الخريطة
    
    Args:
        center_lat: خط العرض للنقطة المركزية
        center_lon: خط الطول للنقطة المركزية
        max_distance_meters: المسافة القصوى بالأمتار
        mosque_name: اسم المسجد (اختياري)
    
    Returns:
        قائمة المساجد مع معلومات المسافة ووقت السفر
    """
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
        
        # إضافة حساب وقت السفر
        mosques = []
        for mosque in result.data:
            mosque_dict = dict(mosque)
            # حساب وقت السفر بالدقائق (سرعة 5 كم/س للمشي)
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
    
    def search(self, criteria: PropertyCriteria, mode: SearchMode) -> List[Property]:
        """
        البحث عن العقارات بناءً على المعايير ونوع البحث
        """
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
        """
        البحث الدقيق - يطابق جميع المعايير بالضبط
        """
        try:
            # بناء استعلام Supabase
            query = self.db.client.table('properties').select('*')
            
            # فلترة الإحداثيات الخاطئة من قاعدة البيانات
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            # الشروط الإلزامية
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            # الحي (إذا حُدد)
            if criteria.district:
                query = query.eq('district', criteria.district)
            
            # عدد الغرف
            if criteria.rooms:
                if criteria.rooms.exact is not None:
                    query = query.eq('rooms', criteria.rooms.exact)
                else:
                    if criteria.rooms.min is not None:
                        query = query.gte('rooms', criteria.rooms.min)
                    if criteria.rooms.max is not None:
                        query = query.lte('rooms', criteria.rooms.max)
            
            # عدد الحمامات
            if criteria.baths:
                if criteria.baths.exact is not None:
                    query = query.eq('baths', criteria.baths.exact)
                else:
                    if criteria.baths.min is not None:
                        query = query.gte('baths', criteria.baths.min)
                    if criteria.baths.max is not None:
                        query = query.lte('baths', criteria.baths.max)
            
            # عدد الصالات
            if criteria.halls:
                if criteria.halls.exact is not None:
                    query = query.eq('halls', criteria.halls.exact)
                else:
                    if criteria.halls.min is not None:
                        query = query.gte('halls', criteria.halls.min)
                    if criteria.halls.max is not None:
                        query = query.lte('halls', criteria.halls.max)

            # فلترة المساحة
            if criteria.area_m2:
                if criteria.area_m2.min is not None:
                    query = query.gte('area_m2', criteria.area_m2.min)
                if criteria.area_m2.max is not None:
                    query = query.lte('area_m2', criteria.area_m2.max)
            
            # فلترة السعر
            if criteria.price:
                if criteria.price.min is not None:
                    query = query.gte('price_num', criteria.price.min)
                if criteria.price.max is not None:
                    query = query.lte('price_num', criteria.price.max)

            # فلترة المترو
            if criteria.metro_time_max:
                query = query.not_.is_('time_to_metro_min', 'null')
                query = query.lte('time_to_metro_min', criteria.metro_time_max)
            
            # تنفيذ الاستعلام الأولي
            result = query.order('price_num').limit(100).execute()
            
            properties_data = result.data if result.data else []
            
            # ==========================================================
            # فلترة الخدمات القريبة (المدارس، الجامعات، المساجد)
            # ==========================================================
            final_properties_data = []
            
            # 1. فلترة المدارس
            if criteria.school_requirements and criteria.school_requirements.required:
                logger.info("البحث الدقيق: جاري تنفيذ فلترة المدارس...")
                
                school_reqs = criteria.school_requirements
                distance_meters = _minutes_to_meters(school_reqs.max_distance_minutes or 10.0) 
                
                # ترجمة الجنس من عربي إلى إنجليزي
                school_gender_english = None
                if school_reqs.gender:
                    if school_reqs.gender.value == "بنات":
                        school_gender_english = "girls"
                    elif school_reqs.gender.value == "بنين":
                        school_gender_english = "boys"

                # ترجمة المراحل الدراسية من عربي إلى إنجليزي
                school_levels_english = None
                if school_reqs.levels:
                    school_levels_english = [LEVELS_TRANSLATION_MAP.get(level, level) for level in school_reqs.levels]
                
                # المرور على العقارات وفلترتها
                for prop_row in properties_data:
                    prop_lat = prop_row.get('final_lat') or prop_row.get('lat')
                    prop_lon = prop_row.get('final_lon') or prop_row.get('lon')

                    if not prop_lat or not prop_lon:
                        continue 

                    try:
                        match_found = self.db.client.rpc(
                            'check_school_proximity',
                            {
                                'p_lat': float(prop_lat),
                                'p_lon': float(prop_lon),
                                'p_distance_meters': distance_meters,
                                'p_gender': school_gender_english,
                                'p_levels': school_levels_english
                            }
                        ).execute()
                        
                        if match_found.data:
                            final_properties_data.append(prop_row)
                            
                    except Exception as rpc_error:
                        logger.error(f"خطأ في استدعاء RPC للعقار {prop_row.get('id')}: {rpc_error}")
            
            # 2. فلترة الجامعات
            elif criteria.university_requirements and criteria.university_requirements.required:
                logger.info("البحث الدقيق: جاري تنفيذ فلترة الجامعات...")
                
                uni_reqs = criteria.university_requirements
                distance_meters = _minutes_to_meters(uni_reqs.max_distance_minutes or 15.0)
                
                # استخدام Fuzzy Matching لاسم الجامعة
                university_name_to_search = uni_reqs.university_name
                if university_name_to_search:
                    matched_name = _find_matching_university(university_name_to_search)
                    if matched_name:
                        logger.info(f"استخدام اسم الجامعة المطابق: '{matched_name}' للطلب: '{university_name_to_search}'")
                        university_name_to_search = matched_name
                    else:
                        logger.warning(f"لم يُعثر على تطابق قريب للجامعة: '{university_name_to_search}'، استخدام الاسم الأصلي")
                
                # المرور على العقارات وفلترتها
                for prop_row in properties_data:
                    prop_lat = prop_row.get('final_lat') or prop_row.get('lat')
                    prop_lon = prop_row.get('final_lon') or prop_row.get('lon')

                    if not prop_lat or not prop_lon:
                        continue 

                    try:
                        match_found = self.db.client.rpc(
                            'check_university_proximity',
                            {
                                'p_lat': float(prop_lat),
                                'p_lon': float(prop_lon),
                                'p_distance_meters': distance_meters,
                                'p_university_name': university_name_to_search
                            }
                        ).execute()
                        
                        if match_found.data:
                            final_properties_data.append(prop_row)
                            
                    except Exception as rpc_error:
                        logger.error(f"خطأ في استدعاء RPC للعقار {prop_row.get('id')}: {rpc_error}")
            
            # 3. فلترة المساجد
            elif criteria.mosque_requirements and criteria.mosque_requirements.required:
                logger.info("البحث الدقيق: جاري تنفيذ فلترة المساجد...")
                
                mosque_reqs = criteria.mosque_requirements
                
                # تحديد المسافة بناءً على نوع الحركة (مشي أو سيارة)
                distance_meters = _minutes_to_meters(
                    mosque_reqs.max_distance_minutes or 5.0,
                    walking=mosque_reqs.walking if mosque_reqs.walking is not None else True
                )
                
                mosque_name = mosque_reqs.mosque_name  # قد يكون None (أي مسجد)
                
                # المرور على العقارات وفلترتها
                for prop_row in properties_data:
                    prop_lat = prop_row.get('final_lat') or prop_row.get('lat')
                    prop_lon = prop_row.get('final_lon') or prop_row.get('lon')

                    if not prop_lat or not prop_lon:
                        continue 

                    try:
                        match_found = self.db.client.rpc(
                            'check_mosque_proximity',
                            {
                                'p_lat': float(prop_lat),
                                'p_lon': float(prop_lon),
                                'p_distance_meters': distance_meters,
                                'p_mosque_name': mosque_name
                            }
                        ).execute()
                        
                        if match_found.data:
                            final_properties_data.append(prop_row)
                            
                    except Exception as rpc_error:
                        logger.error(f"خطأ في استدعاء RPC للعقار {prop_row.get('id')}: {rpc_error}")
            
            else:
                # إذا لم يطلب المستخدم فلترة خدمات، استخدم كل النتائج الأولية
                final_properties_data = properties_data
            
            # ==========================================================
            # نهاية الفلترة
            # ==========================================================

            # تحويل النتائج النهائية إلى Property objects
            properties = [self._row_to_property(row) for row in final_properties_data]
            
            # ==========================================================
            # [جديد] إضافة بيانات المساجد والجامعات للعرض على الخريطة
            # ==========================================================
            
            if properties:
                # حساب النقطة المركزية للعقارات
                center = _calculate_properties_center(final_properties_data)
                
                if center:
                    # إضافة الجامعات إذا كان المستخدم طلبها
                    if criteria.university_requirements and criteria.university_requirements.required:
                        uni_reqs = criteria.university_requirements
                        max_distance = _minutes_to_meters(uni_reqs.max_distance_minutes or 15.0) * 1.5  # نضيف 50% للعرض
                        
                        nearby_universities = _get_nearby_universities_for_display(
                            center['lat'],
                            center['lon'],
                            max_distance,
                            uni_reqs.university_name
                        )
                        
                        # إضافة الجامعات لكل عقار
                        for prop in properties:
                            prop.nearby_universities = nearby_universities
                    
                    # إضافة المساجد إذا كان المستخدم طلبها
                    if criteria.mosque_requirements and criteria.mosque_requirements.required:
                        mosque_reqs = criteria.mosque_requirements
                        max_distance = _minutes_to_meters(
                            mosque_reqs.max_distance_minutes or 5.0,
                            walking=mosque_reqs.walking if mosque_reqs.walking is not None else True
                        ) * 1.5  # نضيف 50% للعرض
                        
                        nearby_mosques = _get_nearby_mosques_for_display(
                            center['lat'],
                            center['lon'],
                            max_distance,
                            mosque_reqs.mosque_name
                        )
                        
                        # إضافة المساجد لكل عقار
                        for prop in properties:
                            prop.nearby_mosques = nearby_mosques
            
            logger.info(f"البحث الدقيق: وجد {len(properties)} عقار")
            
            # تطبيق الـ limit النهائي بعد الفلترة
            return properties[:self.exact_limit]
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدقيق: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _hybrid_search(self, criteria: PropertyCriteria) -> List[Property]:
        """
        البحث الهجين - يجمع بين البحث SQL والبحث الدلالي
        """
        try:
            # المرحلة 1: البحث SQL مع توسيع النطاقات
            sql_results = self._flexible_sql_search(criteria)
            
            # المرحلة 2: البحث الدلالي (Vector Similarity)
            vector_results = []
            if criteria.original_query:
                vector_results = self._vector_search(criteria.original_query)
            
            # المرحلة 3: دمج النتائج وإعادة الترتيب
            merged_results = self._merge_and_rerank(sql_results, vector_results, criteria)
            
            logger.info(f"البحث الهجين: وجد {len(merged_results)} عقار")
            return merged_results[:self.hybrid_limit]
            
        except Exception as e:
            logger.error(f"خطأ في البحث الهجين: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _flexible_sql_search(self, criteria: PropertyCriteria) -> List[Dict[str, Any]]:
        """
        بحث SQL مرن - يوسع نطاقات البحث
        """
        try:
            # بناء الاستعلام
            query = self.db.client.table('properties').select('*')

            # فلترة الإحداثيات الخاطئة
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            # الشروط الإلزامية
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            # توسيع نطاق السعر (±20%)
            if criteria.price and criteria.price.max:
                expanded_max = criteria.price.max * 1.2
                query = query.lte('price_num', expanded_max)
            
            # تنفيذ الاستعلام
            result = query.order('price_num').limit(200).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"خطأ في البحث SQL المرن: {e}")
            return []
    
    def _vector_search(self, query_text: str) -> List[Dict[str, Any]]:
        """
        البحث الدلالي باستخدام Embeddings
        """
        try:
            # توليد embedding للطلب
            query_embedding = embedding_generator.generate_embedding(query_text)
            
            if not query_embedding:
                return []
            
            # البحث في Supabase باستخدام match_documents
            result = self.db.client.rpc(
                'match_documents',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.7,
                    'match_count': 50
                }
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدلالي: {e}")
            return []
    
    def _merge_and_rerank(
        self,
        sql_results: List[Dict[str, Any]],
        vector_results: List[Dict[str, Any]],
        criteria: PropertyCriteria
    ) -> List[Property]:
        """
        دمج نتائج البحث SQL والدلالي وإعادة ترتيبها
        """
        # دمج النتائج بناءً على ID
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
            halls=row.get('halls')
        )


# إنشاء instance عام من SearchEngine
search_engine = SearchEngine()
