"""
محرك البحث الهجين (Exact + Vector Similarity)
النسخة المحدثة - تعمل مع Supabase REST API
"""
from models import PropertyCriteria, Property, SearchMode
from database import db
from config import settings
from typing import List, Optional, Dict, Any
import logging
from embedding_generator import embedding_generator

logger = logging.getLogger(__name__)


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
        البحث الدقيق - يطابق جميع المعايير بالضبط (نسخة محسّنة)
        """
        try:
            # بناء استعلام Supabase
            query = self.db.client.table('properties').select('*')
            
            # !! -- تعديل: فلترة الإحداثيات الخاطئة من قاعدة البيانات -- !!
            # (نستخدم final_lat لأنه الحقل الأساسي في الداتابيس)
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            # !! -- نهاية التعديل -- !!

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
            
            # تنفيذ الاستعلام
            result = query.order('price_num').limit(self.exact_limit).execute()
            
            # معالجة النتائج
            properties_data = result.data if result.data else []
            
            # تحويل النتائج إلى Property objects
            properties = [self._row_to_property(row) for row in properties_data]
            
            logger.info(f"البحث الدقيق (المحسّن): وجد {len(properties)} عقار")
            return properties
            
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

            # !! -- تعديل: فلترة الإحداثيات الخاطئة من قاعدة البيانات -- !!
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            # !! -- نهاية التعديل -- !!
            
            # الشروط الإلزامية
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            # الحي (مرن)
            if criteria.district:
                query = query.eq('district', criteria.district)
            
            # عدد الغرف (مع مرونة ±1)
            if criteria.rooms and criteria.rooms.exact is not None:
                min_rooms = max(0, criteria.rooms.exact - 1)
                max_rooms = criteria.rooms.exact + 1
                query = query.gte('rooms', min_rooms).lte('rooms', max_rooms)
            elif criteria.rooms:
                if criteria.rooms.min is not None:
                    query = query.gte('rooms', max(0, criteria.rooms.min - 1))
                if criteria.rooms.max is not None:
                    query = query.lte('rooms', criteria.rooms.max + 1)
            
            # عدد الحمامات (مع مرونة)
            if criteria.baths and criteria.baths.exact is not None:
                min_baths = max(0, criteria.baths.exact - 1)
                max_baths = criteria.baths.exact + 1
                query = query.gte('baths', min_baths).lte('baths', max_baths)
            
            # عدد الصالات (مع مرونة)
            if criteria.halls and criteria.halls.exact is not None:
                min_halls = max(0, criteria.halls.exact - 1)
                max_halls = criteria.halls.exact + 1
                query = query.gte('halls', min_halls).lte('halls', max_halls)
            
            # تنفيذ الاستعلام
            result = query.limit(100).execute()
            
            # معالجة النتائج
            properties = result.data if result.data else []
            
            # (حساب النقاط كما هو...)
            for prop in properties:
                scores = []
                if criteria.rooms and criteria.rooms.exact is not None:
                    prop_rooms = prop.get('rooms', 0) or 0
                    if prop_rooms == criteria.rooms.exact: scores.append(1.0)
                    elif abs(prop_rooms - criteria.rooms.exact) <= 1: scores.append(0.7)
                    else: scores.append(0.3)
                else: scores.append(1.0)
                
                if criteria.baths and criteria.baths.exact is not None:
                    prop_baths = prop.get('baths', 0) or 0
                    if prop_baths == criteria.baths.exact: scores.append(1.0)
                    elif abs(prop_baths - criteria.baths.exact) <= 1: scores.append(0.7)
                    else: scores.append(0.3)
                else: scores.append(1.0)
                
                if criteria.area_m2 and (criteria.area_m2.min or criteria.area_m2.max):
                    area = prop.get('area_m2')
                    if area is not None:
                        min_area = criteria.area_m2.min or 0
                        max_area = criteria.area_m2.max or 999999
                        expanded_min = min_area * 0.8
                        expanded_max = max_area * 1.2
                        if min_area <= area <= max_area: scores.append(1.0)
                        elif expanded_min <= area <= expanded_max: scores.append(0.7)
                        else: scores.append(0.3)
                    else: scores.append(0.5)
                else: scores.append(1.0)
                
                if criteria.price and (criteria.price.min or criteria.price.max):
                    price = prop.get('price_num')
                    if price is not None:
                        min_price = criteria.price.min or 0
                        max_price = criteria.price.max or 999999999
                        expanded_min_price = min_price * 0.8
                        expanded_max_price = max_price * 1.2
                        if min_price <= price <= max_price: scores.append(1.0)
                        elif expanded_min_price <= price <= expanded_max_price: scores.append(0.7)
                        else: scores.append(0.3)
                    else: scores.append(0.5)
                else: scores.append(1.0)
                
                if criteria.metro_time_max:
                    metro_time = prop.get('time_to_metro_min')
                    if metro_time is not None:
                        if metro_time <= criteria.metro_time_max: scores.append(1.0)
                        elif metro_time <= criteria.metro_time_max * 1.5: scores.append(0.5)
                        else: scores.append(0.2)
                    else: scores.append(0.5)
                else: scores.append(1.0)
                
                prop['sql_score'] = sum(scores) / len(scores) if scores else 0.5
                prop['room_score'] = scores[0] if len(scores) > 0 else 1.0
                prop['area_score'] = scores[2] if len(scores) > 2 else 1.0
                prop['price_score'] = scores[3] if len(scores) > 3 else 1.0
                prop['metro_score'] = scores[4] if len(scores) > 4 else 1.0
            
            logger.info(f"البحث المرن: وجد {len(properties)} عقار")
            return properties
            
        except Exception as e:
            logger.error(f"خطأ في البحث المرن: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _vector_search(self, query_text: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        البحث الدلالي باستخدام embeddings (BGE-m3) - (نسخة مفعلّة)
        """
        try:
            logger.info(f"البحث الدلالي: جاري توليد embedding لـ: '{query_text}'")
            query_embedding = embedding_generator.generate(query_text)
            
            if not query_embedding:
                logger.error("البحث الدلالي: فشل توليد الـ embedding")
                return []
            
            logger.info("البحث الدلالي: جاري استدعاء دالة 'match_properties_bge_m3' في Supabase")
            result = self.db.client.rpc(
                'match_properties_bge_m3',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': settings.VECTOR_SIMILARITY_THRESHOLD,
                    'match_count': limit
                }
            ).execute()
            
            if result.data:
                logger.info(f"البحث الدلالي: تم العثور على {len(result.data)} نتيجة")
                matching_ids = [row['id'] for row in result.data]
                scores_map = {row['id']: row['similarity_score'] for row in result.data}
                
                properties_result = self.db.client.table('properties') \
                                        .select('*') \
                                        .in_('id', matching_ids) \
                                        .execute()
                
                properties_data = properties_result.data if properties_result.data else []
                
                for prop in properties_data:
                    prop['similarity_score'] = scores_map.get(prop['id'], 0.0)
                
                return properties_data
            else:
                logger.info("البحث الدلالي: لم يتم العثور على نتائج مطابقة")
                return []
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدلالي: {e}")
            import traceback
            traceback.print_exc()
            return []
            
    def _merge_and_rerank(self, sql_results: List[Dict], vector_results: List[Dict], 
                          criteria: PropertyCriteria) -> List[Property]:
        """
        دمج نتائج SQL والـ Vector وإعادة ترتيبها
        """
        try:
            properties_dict = {}
            
            for row in sql_results:
                prop_id = row['id']
                properties_dict[prop_id] = {
                    **row,
                    'sql_score': row.get('sql_score', 0.5),
                    'vector_score': 0.0
                }
            
            for row in vector_results:
                prop_id = row['id']
                if prop_id in properties_dict:
                    properties_dict[prop_id]['vector_score'] = row.get('similarity_score', 0.0)
                else:
                    properties_dict[prop_id] = {
                        **row,
                        'sql_score': 0.0,
                        'vector_score': row.get('similarity_score', 0.0)
                    }
            
            for prop_id, prop_data in properties_dict.items():
                sql_score = prop_data.get('sql_score', 0.0)
                vector_score = prop_data.get('vector_score', 0.0)
                final_score = (self.sql_weight * sql_score) + (self.vector_weight * vector_score)
                prop_data['final_score'] = final_score
            
            sorted_properties = sorted(
                properties_dict.values(),
                key=lambda x: x['final_score'],
                reverse=True
            )
            
            properties = []
            for row in sorted_properties:
                prop = self._row_to_property(row)
                prop.match_score = row['final_score']
                properties.append(prop)
            
            return properties
            
        except Exception as e:
            logger.error(f"خطأ في دمج النتائج: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _row_to_property(self, row: Dict[str, Any]) -> Property:
        """
        تحويل صف من قاعدة البيانات إلى Property object (نسخة موحدة)
        """
        try:
            rooms = int(row['rooms']) if row.get('rooms') is not None else None
            baths = int(row['baths']) if row.get('baths') is not None else None
            halls = int(row['halls']) if row.get('halls') is not None else None

            # !! -- هذا هو الإصلاح (التوحيد) -- !!
            # جلب الإحداثيات الصحيحة (final) ووضعها في الحقول القياسية (lat/lon)
            # إذا كانت final_lat فارغة، استخدم lat العادية كاحتياط
            correct_lat = row.get('final_lat') or row.get('lat')
            correct_lon = row.get('final_lon') or row.get('lon')
            
            return Property(
                id=row['id'],
                url=row.get('url'),
                purpose=row.get('purpose'),
                property_type=row.get('property_type'),
                city=row.get('city'),
                district=row.get('district'),
                title=row.get('title'),
                price_num=row.get('price_num'),
                price_currency=row.get('price_currency'),
                price_period=row.get('price_period'),
                area_m2=row.get('area_m2'),
                description=row.get('description'),
                image_url=row.get('image_url'),
                
                # !! -- إرسال الإحداثيات الصحيحة فقط في 'lat' و 'lon' -- !!
                lat=correct_lat,
                lon=correct_lon,
                
                # (الحقول القديمة (final) لا تهم الواجهة الآن)
                final_lat=row.get('final_lat'),
                final_lon=row.get('final_lon'),

                time_to_metro_min=row.get('time_to_metro_min'),
                rooms=rooms,
                baths=baths,
                halls=halls,
                match_score=row.get('final_score') or row.get('sql_score')
            )
        except Exception as e:
            logger.error(f"خطأ في تحويل الصف: {row.get('id', 'unknown')}: {e}")
            import traceback
            traceback.print_exc()
            return Property(
                id=row.get('id', 'unknown'),
                purpose=row.get('purpose', ''),
                property_type=row.get('property_type', '')
            )


# إنشاء instance عام من SearchEngine
search_engine = SearchEngine()
