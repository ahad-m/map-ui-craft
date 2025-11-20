"""
محرك البحث (Exact + Flexible SQL فقط)
النسخة النهائية - بدون البحث الدلالي
"""
from models import PropertyCriteria, Property, SearchMode
from database import db
from config import settings
from typing import List, Optional, Dict, Any
import logging
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
        
        query_normalized = normalize_arabic_text(query_name)
        
        best_match = None
        best_score = 0.0
        
        for name in all_names:
            name_normalized = normalize_arabic_text(name)
            score = calculate_similarity_score(query_normalized, name_normalized)
            
            if score > best_score:
                best_score = score
                best_match = name
        
        if best_score >= threshold:
            logger.info(f"✅ تم العثور على تطابق للجامعة: '{query_name}' → '{best_match}' (score: {best_score:.2f})")
            return best_match
        else:
            logger.warning(f"⚠️ لم يتم العثور على تطابق جيد للجامعة: '{query_name}' (أفضل score: {best_score:.2f})")
            return None
            
    except Exception as e:
        logger.error(f"خطأ في البحث عن الجامعة: {e}")
        return None


class SearchEngine:
    def __init__(self):
        self.db = db
        self.exact_limit = 20
        self.similar_limit = 50
    
    def search(self, criteria: PropertyCriteria, mode: SearchMode = SearchMode.EXACT) -> List[Property]:
        """نقطة الدخول الرئيسية للبحث"""
        try:
            if mode == SearchMode.EXACT:
                results = self._exact_search(criteria)
            else:
                results = self._flexible_search(criteria)
            
            # تحويل النتائج إلى Property objects
            properties = [self._row_to_property(row) for row in results]
            
            logger.info(f"✅ تم إرجاع {len(properties)} عقار")
            return properties
            
        except Exception as e:
            logger.error(f"خطأ في البحث: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _exact_search(self, criteria: PropertyCriteria) -> List[Dict[str, Any]]:
        """بحث دقيق - يطابق جميع المعايير"""
        try:
            query = self.db.client.table('properties').select('*')
            
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            # الغرض (بيع/إيجار)
            query = query.eq('purpose', criteria.purpose.value)
            
            # نوع العقار
            query = query.eq('property_type', criteria.property_type.value)
            
            # المدينة
            if criteria.city:
                query = query.eq('city', criteria.city)
            
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
            
            # المساحة
            if criteria.area_m2:
                if criteria.area_m2.min is not None:
                    query = query.gte('area_m2', criteria.area_m2.min)
                if criteria.area_m2.max is not None:
                    query = query.lte('area_m2', criteria.area_m2.max)
            
            # السعر
            if criteria.price:
                if criteria.price.min is not None:
                    query = query.gte('price_num', criteria.price.min)
                if criteria.price.max is not None:
                    query = query.lte('price_num', criteria.price.max)
            
            result = query.order('price_num').limit(self.exact_limit).execute()
            
            if not result.data:
                logger.info("❌ لم يتم العثور على عقارات مطابقة")
                return []
            
            properties_data = result.data
            
            # إضافة الخدمات القريبة
            properties_data = self._add_nearby_services(properties_data, criteria)
            
            logger.info(f"✅ البحث الدقيق: وجد {len(properties_data)} عقار")
            return properties_data
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدقيق: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _flexible_search(self, criteria: PropertyCriteria) -> List[Dict[str, Any]]:
        """
        بحث مرن - يطبق المعايير الأساسية مع مرونة ±1 أو ±20%
        (نفس منطق النسخة القديمة)
        """
        try:
            query = self.db.client.table('properties').select('*')
            
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            
            # الشروط الإلزامية
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            # المدينة (إلزامية)
            if criteria.city:
                query = query.eq('city', criteria.city)
            
            # الحي (إلزامي إذا حُدد)
            if criteria.district:
                query = query.eq('district', criteria.district)
                logger.info(f"🎯 فلتر الحي: {criteria.district}")
            
            # [!! المرونة ±1 !!] عدد الغرف
            if criteria.rooms and criteria.rooms.exact is not None:
                min_rooms = max(0, criteria.rooms.exact - 1)
                max_rooms = criteria.rooms.exact + 1
                query = query.gte('rooms', min_rooms)
                query = query.lte('rooms', max_rooms)
                logger.info(f"🎯 فلتر الغرف: {min_rooms}-{max_rooms}")
            
            # [!! المرونة ±1 !!] عدد الحمامات
            if criteria.baths and criteria.baths.exact is not None:
                min_baths = max(0, criteria.baths.exact - 1)
                max_baths = criteria.baths.exact + 1
                query = query.gte('baths', min_baths)
                query = query.lte('baths', max_baths)
                logger.info(f"🎯 فلتر الحمامات: {min_baths}-{max_baths}")
            
            # [!! المرونة ±1 !!] عدد الصالات
            if criteria.halls and criteria.halls.exact is not None:
                min_halls = max(0, criteria.halls.exact - 1)
                max_halls = criteria.halls.exact + 1
                query = query.gte('halls', min_halls)
                query = query.lte('halls', max_halls)
                logger.info(f"🎯 فلتر الصالات: {min_halls}-{max_halls}")
            
            # [!! المرونة ±20% !!] المساحة
            if criteria.area_m2:
                if criteria.area_m2.min is not None:
                    min_area = criteria.area_m2.min * 0.8
                    query = query.gte('area_m2', min_area)
                    logger.info(f"🎯 فلتر المساحة الدنيا: {min_area}")
                if criteria.area_m2.max is not None:
                    max_area = criteria.area_m2.max * 1.2
                    query = query.lte('area_m2', max_area)
                    logger.info(f"🎯 فلتر المساحة القصوى: {max_area}")
            
            # [!! المرونة ±30% !!] السعر
            if criteria.price:
                if criteria.price.min is not None:
                    min_price = criteria.price.min * 0.7
                    query = query.gte('price_num', min_price)
                    logger.info(f"🎯 فلتر السعر الأدنى: {min_price}")
                if criteria.price.max is not None:
                    max_price = criteria.price.max * 1.3
                    query = query.lte('price_num', max_price)
                    logger.info(f"🎯 فلتر السعر الأقصى: {max_price}")
            
            result = query.order('price_num').limit(self.similar_limit).execute()
            
            if not result.data:
                logger.info("❌ لم يتم العثور على عقارات مشابهة")
                return []
            
            properties_data = result.data
            
            # [!! فلترة إضافية !!] الميترو والخدمات
            if criteria.metro_time_max or criteria.university_requirements or criteria.mosque_requirements:
                properties_data = self._filter_by_services(properties_data, criteria)
            
            # إضافة الخدمات القريبة
            properties_data = self._add_nearby_services(properties_data, criteria)
            
            logger.info(f"✅ البحث المرن: وجد {len(properties_data)} عقار")
            return properties_data
            
        except Exception as e:
            logger.error(f"خطأ في البحث المرن: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _filter_by_services(
        self,
        properties: List[Dict[str, Any]],
        criteria: PropertyCriteria
    ) -> List[Dict[str, Any]]:
        """
        فلترة العقارات بناءً على قربها من الخدمات
        (الميترو، الجامعات، المساجد)
        """
        filtered = []
        
        for prop in properties:
            # فحص الميترو (مع مرونة ±2 دقيقة)
            if criteria.metro_time_max:
                prop_metro_time = prop.get('time_to_metro_min')
                if prop_metro_time is not None:
                    max_metro_time = criteria.metro_time_max + 2
                    if prop_metro_time > max_metro_time:
                        continue
            
            # إذا وصلنا هنا، العقار يطابق جميع المعايير
            filtered.append(prop)
        
        logger.info(f"🎯 بعد فلترة الخدمات: {len(filtered)} عقار")
        return filtered
    
    def _add_nearby_services(
        self,
        properties: List[Dict[str, Any]],
        criteria: PropertyCriteria
    ) -> List[Dict[str, Any]]:
        """إضافة معلومات الخدمات القريبة لكل عقار"""
        if not properties:
            return properties
        
        for prop in properties:
            prop_lat = prop.get('final_lat')
            prop_lon = prop.get('final_lon')
            
            if not prop_lat or not prop_lon:
                continue
            
            # إضافة المدارس القريبة
            if criteria.school_requirements and criteria.school_requirements.required:
                try:
                    schools = self._get_nearby_schools(
                        prop_lat,
                        prop_lon,
                        criteria.school_requirements
                    )
                    prop['nearby_schools'] = schools
                except Exception as e:
                    logger.error(f"خطأ في جلب المدارس: {e}")
                    prop['nearby_schools'] = []
            
            # إضافة الجامعات القريبة
            if criteria.university_requirements and criteria.university_requirements.required:
                try:
                    universities = self._get_nearby_universities_for_display(
                        prop_lat,
                        prop_lon,
                        criteria.university_requirements
                    )
                    prop['nearby_universities'] = universities
                except Exception as e:
                    logger.error(f"خطأ في جلب الجامعات: {e}")
                    prop['nearby_universities'] = []
            
            # إضافة المساجد القريبة
            if criteria.mosque_requirements and criteria.mosque_requirements.required:
                try:
                    mosques = self._get_nearby_mosques_for_display(
                        prop_lat,
                        prop_lon,
                        criteria.mosque_requirements
                    )
                    prop['nearby_mosques'] = mosques
                except Exception as e:
                    logger.error(f"خطأ في جلب المساجد: {e}")
                    prop['nearby_mosques'] = []
        
        return properties
    
    def _get_nearby_schools(
        self,
        center_lat: float,
        center_lon: float,
        school_reqs
    ) -> List[Dict[str, Any]]:
        """جلب المدارس القريبة من العقار"""
        try:
            max_distance_meters = _minutes_to_meters(
                school_reqs.max_distance_minutes,
                walking=school_reqs.walking
            )
            
            # ترجمة المستوى
            levels_en = []
            if school_reqs.levels:
                for level_ar in school_reqs.levels:
                    level_en = LEVELS_TRANSLATION_MAP.get(level_ar, level_ar)
                    levels_en.append(level_en)
            
            # ترجمة الجنس
            gender_en = None
            if school_reqs.gender:
                if school_reqs.gender == "بنات":
                    gender_en = "girls"
                elif school_reqs.gender == "بنين":
                    gender_en = "boys"
            
            result = self.db.client.rpc(
                'get_nearby_schools',
                {
                    'p_lat': center_lat,
                    'p_lon': center_lon,
                    'p_distance_meters': max_distance_meters,
                    'p_gender': gender_en,
                    'p_levels': levels_en if levels_en else None
                }
            ).execute()
            
            if not result.data:
                return []
            
            # إضافة حساب وقت السفر
            schools = []
            for school in result.data:
                school_dict = dict(school)
                # حساب المسافة
                from math import radians, sin, cos, sqrt, atan2
                
                lat1, lon1 = radians(center_lat), radians(center_lon)
                lat2, lon2 = radians(school['lat']), radians(school['lon'])
                
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                distance_meters = 6371000 * c
                
                # حساب وقت السفر
                if school_reqs.walking:
                    travel_minutes = (distance_meters / 1000.0) / 5.0 * 60.0
                else:
                    travel_minutes = (distance_meters / 1000.0) / 30.0 * 60.0
                
                school_dict['travel_minutes'] = round(travel_minutes, 1)
                schools.append(school_dict)
            
            return schools
            
        except Exception as e:
            logger.error(f"خطأ في جلب المدارس: {e}")
            return []
    
    def _get_nearby_universities_for_display(
        self,
        center_lat: float,
        center_lon: float,
        uni_reqs
    ) -> List[Dict[str, Any]]:
        """جلب الجامعات القريبة من العقار للعرض على الخريطة"""
        try:
            # [!! تطبيق المرونة ±5 دقائق !!]
            max_distance_minutes = uni_reqs.max_distance_minutes + 5
            max_distance_meters = _minutes_to_meters(max_distance_minutes, walking=False)
            
            # البحث عن اسم الجامعة المطابق
            university_name = None
            if uni_reqs.university_name:
                university_name = _find_matching_university(uni_reqs.university_name)
            
            result = self.db.client.rpc(
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
                distance_meters = uni_dict.get('distance_meters', 0)
                drive_minutes = (distance_meters / 1000.0) / 30.0 * 60.0
                uni_dict['drive_minutes'] = round(drive_minutes, 1)
                universities.append(uni_dict)
            
            return universities
            
        except Exception as e:
            logger.error(f"خطأ في جلب الجامعات: {e}")
            return []
    
    def _get_nearby_mosques_for_display(
        self,
        center_lat: float,
        center_lon: float,
        mosque_reqs
    ) -> List[Dict[str, Any]]:
        """جلب المساجد القريبة من العقار للعرض على الخريطة"""
        try:
            # [!! تطبيق المرونة ±2 دقيقة !!]
            max_distance_minutes = mosque_reqs.max_distance_minutes + 2
            max_distance_meters = _minutes_to_meters(
                max_distance_minutes,
                walking=mosque_reqs.walking
            )
            
            result = self.db.client.rpc(
                'get_mosques_for_display',
                {
                    'center_lat': center_lat,
                    'center_lon': center_lon,
                    'max_distance_meters': max_distance_meters,
                    'mosque_name': mosque_reqs.mosque_name
                }
            ).execute()
            
            if not result.data:
                return []
            
            # إضافة حساب وقت السفر
            mosques = []
            for mosque in result.data:
                mosque_dict = dict(mosque)
                distance_meters = mosque_dict.get('distance_meters', 0)
                
                if mosque_reqs.walking:
                    walk_minutes = (distance_meters / 1000.0) / 5.0 * 60.0
                    mosque_dict['walk_minutes'] = round(walk_minutes, 1)
                else:
                    drive_minutes = (distance_meters / 1000.0) / 30.0 * 60.0
                    mosque_dict['drive_minutes'] = round(drive_minutes, 1)
                
                mosques.append(mosque_dict)
            
            return mosques
            
        except Exception as e:
            logger.error(f"خطأ في جلب المساجد: {e}")
            return []
    
    def _row_to_property(self, row: Dict[str, Any]) -> Property:
        """تحويل صف من قاعدة البيانات إلى Property object"""
        return Property(
            id=row.get('id'),
            url=row.get('url'),
            purpose=row.get('purpose'),
            property_type=row.get('property_type'),
            city=row.get('city'),
            district=row.get('district'),
            title=row.get('title'),
            price_num=float(row['price_num']) if row.get('price_num') else None,
            price_currency=row.get('price_currency'),
            price_period=row.get('price_period'),
            area_m2=float(row['area_m2']) if row.get('area_m2') else None,
            description=row.get('description'),
            image_url=row.get('image_url'),
            lat=row.get('lat'),
            lon=row.get('lon'),
            final_lat=row.get('final_lat'),
            final_lon=row.get('final_lon'),
            time_to_metro_min=float(row['time_to_metro_min']) if row.get('time_to_metro_min') else None,
            rooms=row.get('rooms'),
            baths=row.get('baths'),
            halls=row.get('halls'),
            nearby_schools=row.get('nearby_schools', []),
            nearby_universities=row.get('nearby_universities', []),
            nearby_mosques=row.get('nearby_mosques', [])
        )


# إنشاء instance واحد
search_engine = SearchEngine()
