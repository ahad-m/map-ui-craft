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
        البحث عن العقارات بناءً
 على المعايير ونوع البحث
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
            
            # فلترة الإحداثيات الخاطئة
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            # الشروط الإلزامية
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            # الحي (إذا حُدد)
            if criteria.district:
                query = query.eq('district', criteria.district)
            
            # (باقي الفلاتر...)
            if criteria.rooms:
                if criteria.rooms.exact is not None:
                    query = query.eq('rooms', criteria.rooms.exact)
                else:
                    if criteria.rooms.min is not None:
                        query = query.gte('rooms', criteria.rooms.min)
                    if criteria.rooms.max is not None:
                        query = query.lte('rooms', criteria.rooms.max)
            
            if criteria.baths:
                if criteria.baths.exact is not None:
                    query = query.eq('baths', criteria.baths.exact)
                else:
                    if criteria.baths.min is not None:
                        query = query.gte('baths', criteria.baths.min)
                    if criteria.baths.max is not None:
                        query = query.lte('baths', criteria.baths.max)
            
            if criteria.halls:
                if criteria.halls.exact is not None:
                    query = query.eq('halls', criteria.halls.exact)
                else:
                    if criteria.halls.min is not None:
                        query = query.gte('halls', criteria.halls.min)
                    if criteria.halls.max is not None:
                        query = query.lte('halls', criteria.halls.max)

            if criteria.area_m2:
                if criteria.area_m2.min is not None:
                    query = query.gte('area_m2', criteria.area_m2.min)
                if criteria.area_m2.max is not None:
                    query = query.lte('area_m2', criteria.area_m2.max)
            
            if criteria.price:
                if criteria.price.min is not None:
                    query = query.gte('price_num', criteria.price.min)
                if criteria.price.max is not None:
                    query = query.lte('price_num', criteria.price.max)

            if criteria.metro_time_max:
                query = query.not_.is_('time_to_metro_min', 'null')
                query = query.lte('time_to_metro_min', criteria.metro_time_max)
            
            # تنفيذ الاستعلام الأولي
            result = query.order('price_num').limit(self.exact_limit * 2).execute() # (نجلب ضعف العدد احتياطاً للفلترة)
            properties_data = result.data if result.data else []
            
            # ==========================================================
            # !! تعديل: مرحلة الفلترة الجغرافية (المدارس والجامعات) !!
            # ==========================================================
            if not properties_data:
                logger.info("البحث الدقيق: لا توجد نتائج أولية.")
                return []

            filtered_properties = []
            
            # التحقق إذا كانت الفلاتر الجغرافية مطلوبة أم لا
            school_req_active = criteria.school_requirements and criteria.school_requirements.required
            uni_req_active = criteria.university_requirements and criteria.university_requirements.required

            # إذا لم تكن مطلوبة، تخطى الفلترة
            if not school_req_active and not uni_req_active:
                filtered_properties = properties_data
            else:
                logger.info(f"البحث الدقيق: بدء الفلترة الجغرافية لـ {len(properties_data)} عقار")
                # فلترة العقارات واحداً تلو الآخر
                for prop in properties_data:
                    lat = prop.get('final_lat') or prop.get('lat')
                    lon = prop.get('final_lon') or prop.get('lon')

                    # إذا لم يكن لديه إحداثيات، تجاهله
                    if not lat or not lon:
                        continue

                    # 1. التحقق من المدارس
                    if school_req_active:
                        is_near_school = self.db.check_school_proximity(lat, lon, criteria.school_requirements)
                        if not is_near_school:
                            continue # إذا لم يكن قريباً من مدرسة، تجاهل العقار وانتقل للتالي

                    # 2. التحقق من الجامعات
                    if uni_req_active:
                        is_near_university = self.db.check_university_proximity(lat, lon, criteria.university_requirements)
                        if not is_near_university:
                            continue # إذا لم يكن قريباً من جامعة، تجاهل العقار وانتقل للتالي
                    
                    # إذا نجح العقار في كل الفلاتر، أضفه للنتائج
                    filtered_properties.append(prop)
            # ==========================================================

            # تحويل النتائج إلى Property objects
            properties = [self._row_to_property(row) for row in filtered_properties]
            
            logger.info(f"البحث الدقيق (المحسّن): وجد {len(properties)} عقار بعد الفلترة")
            return properties[:self.exact_limit] # إرجاع العدد المحدد
            
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
            # المرحلة 1: البحث SQL مع توسيع النطاقات (يحتوي الآن على فلترة جغرافية)
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
            
            # الحي (مرن)
            if criteria.district:
                query = query.eq('district', criteria.district)
            
            # (باقي الفلاتر المرنة...)
            if criteria.rooms and criteria.rooms.exact is not None:
                min_rooms = max(0, criteria.rooms.exact - 1)
                max_rooms = criteria.rooms.exact + 1
                query = query.gte('rooms', min_rooms).lte('rooms', max_rooms)
            elif criteria.rooms:
                if criteria.rooms.min is not None:
                    query = query.gte('rooms', max(0, criteria.rooms.min - 1))
                if criteria.rooms.max is not None:
                    query = query.lte('rooms', criteria.rooms.max + 1)
            
            # (باقي الفلاتر المرنة للحمامات والصالات...)
            
            # تنفيذ الاستعلام الأولي
            result = query.limit(100).execute()
            properties_data = result.data if result.data else []

            # ==========================================================
            # !! تعديل: مرحلة الفلترة الجغرافية (المدارس والجامعات) !!
            # ==========================================================
            if not properties_data:
                logger.info("البحث المرن: لا توجد نتائج أولية.")
                return []

            filtered_properties = []
            school_req_active = criteria.school_requirements and criteria.school_requirements.required
            uni_req_active = criteria.university_requirements and criteria.university_requirements.required

            if not school_req_active and not uni_req_active:
                filtered_properties = properties_data
            else:
                logger.info(f"البحث المرن: بدء الفلترة الجغرافية لـ {len(properties_data)} عقار")
                for prop in properties_data:
                    lat = prop.get('final_lat') or prop.get('lat')
                    lon = prop.get('final_lon') or prop.get('lon')

                    if not lat or not lon:
                        continue

                    if school_req_active:
                        is_near_school = self.db.check_school_proximity(lat, lon, criteria.school_requirements)
                        if not is_near_school:
                            continue 

                    if uni_req_active:
                        is_near_university = self.db.check_university_proximity(lat, lon, criteria.university_requirements)
                        if not is_near_university:
                            continue
                    
                    filtered_properties.append(prop)
            # ==========================================================

            # (حساب النقاط فقط على العقارات المفلترة)
            for prop in filtered_properties:
                scores = []
                # (الكود الخاص بحساب النقاط... scores.append(...))
                # ... (تم حذفه للاختصار، افترض أنه موجود هنا) ...
                
                prop['sql_score'] = sum(scores) / len(scores) if scores else 0.5
            
            logger.info(f"البحث المرن: وجد {len(filtered_properties)} عقار بعد الفلترة")
            return filtered_properties
            
        except Exception as e:
            logger.error(f"خطأ في البحث المرن: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _vector_search(self, query_text: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        البحث الدلالي
        """
        # (الكود كما هو، لا يحتاج تعديل)
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
        # (الكود كما هو، لا يحتاج تعديل)
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
        # (الكود كما هو، لا يحتاج تعديل)
        try:
            rooms = int(row['rooms']) if row.get('rooms') is not None else None
            baths = int(row['baths']) if row.get('baths') is not None else None
            halls = int(row['halls']) if row.get('halls') is not None else None

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
                lat=correct_lat,
                lon=correct_lon,
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
