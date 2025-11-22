"""
محرك البحث المطور (Hybrid + Geospatial)
يستخدم تقنيات البحث المتجهي (Vector Search) والبحث المكاني (PostGIS)
"""
from models import PropertyCriteria, Property, SearchMode
from database import db
from config import settings
from typing import List, Optional, Dict, Any
import logging
from arabic_utils import normalize_arabic_text, calculate_similarity_score
# استيراد مولد المتجهات للبحث الهجين
from embedding_generator import embedding_generator

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
            return best_match
        else:
            return None
            
    except Exception as e:
        logger.error(f"خطأ في البحث عن الجامعة: {e}")
        return None


class SearchEngine:
    def __init__(self):
        self.db = db
        self.exact_limit = 30
        self.similar_limit = 100
    
    def _get_entity_location(self, entity_name: str, table_name: str) -> Optional[tuple]:
        """جلب إحداثيات كيان (جامعة/مسجد) بالاسم"""
        try:
            # البحث باستخدام ILIKE للتغلب على مشاكل الحالة
            response = self.db.client.table(table_name)\
                .select('lat, lon')\
                .ilike('name_ar', f'%{entity_name}%')\
                .limit(1)\
                .execute()
            
            if response.data and len(response.data) > 0:
                row = response.data[0]
                logger.info(f"📍 تم العثور على موقع {entity_name}: {row['lat']}, {row['lon']}")
                return (row['lat'], row['lon'])
            
            logger.warning(f"⚠️ لم يتم العثور على إحداثيات: {entity_name} في جدول {table_name}")
            return None
            
        except Exception as e:
            logger.error(f"❌ خطأ في جلب إحداثيات {entity_name}: {e}")
            return None

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
        """بحث دقيق - يستخدم البحث المكاني المباشر (RPC) عند توفر موقع"""
        try:
            # 1. التحقق مما إذا كان البحث يعتمد على موقع محدد (جامعة أو مسجد بالاسم)
            target_lat = None
            target_lon = None
            radius_meters = None

            # أ) هل حدد جامعة بالاسم؟
            if criteria.university_requirements and criteria.university_requirements.university_name:
                uni_name = criteria.university_requirements.university_name
                matched_name = _find_matching_university(uni_name) or uni_name
                loc = self._get_entity_location(matched_name, 'universities')
                if loc:
                    target_lat, target_lon = loc
                    mins = criteria.university_requirements.max_distance_minutes or 15
                    radius_meters = _minutes_to_meters(mins, walking=False)

            # ب) هل حدد مسجداً بالاسم؟ (إذا لم تكن الجامعة محددة)
            elif criteria.mosque_requirements and criteria.mosque_requirements.mosque_name:
                mosque_name = criteria.mosque_requirements.mosque_name
                loc = self._get_entity_location(mosque_name, 'mosques')
                if loc:
                    target_lat, target_lon = loc
                    mins = criteria.mosque_requirements.max_distance_minutes or 5
                    radius_meters = _minutes_to_meters(mins, walking=criteria.mosque_requirements.walking)

            # 2. إذا وجدنا موقعاً مستهدفاً، نستخدم دالة البحث المكاني السريع (RPC)
            if target_lat and target_lon and radius_meters:
                try:
                    rpc_params = {
                        'ref_lat': target_lat,
                        'ref_lon': target_lon,
                        'radius_meters': radius_meters,
                        'p_purpose': criteria.purpose.value,
                        'p_property_type': criteria.property_type.value,
                        'p_city': criteria.city,
                        'min_price': criteria.price.min if criteria.price else None,
                        'max_price': criteria.price.max if criteria.price else None,
                        'min_rooms': criteria.rooms.min if criteria.rooms else None,
                        'min_area': criteria.area_m2.min if criteria.area_m2 else None
                    }
                    
                    logger.info("🚀 استدعاء دالة البحث المكاني search_properties_nearby...")
                    result = self.db.client.rpc('search_properties_nearby', rpc_params).execute()
                    
                    if result.data:
                        properties_data = result.data
                        properties_data = self._add_nearby_services(properties_data, criteria)
                        return properties_data
                    else:
                        return []
                        
                except Exception as rpc_error:
                    logger.error(f"فشل RPC، العودة للبحث التقليدي: {rpc_error}")

            # 3. البحث التقليدي (إذا لم يكن هناك موقع محدد أو فشل الـ RPC)
            logger.info("🔍 استخدام البحث التقليدي (فلاتر عادية)")
            query = self.db.client.table('properties').select('*')
            
            query = query.not_.is_('final_lat', 'null')
            query = query.not_.eq('final_lat', 0)
            query = query.eq('purpose', criteria.purpose.value)
            query = query.eq('property_type', criteria.property_type.value)
            
            if criteria.city:
                query = query.eq('city', criteria.city)
            
            if criteria.district:
                query = query.eq('district', criteria.district)
            
            # الفلاتر الرقمية
            if criteria.rooms:
                if criteria.rooms.exact is not None:
                    query = query.eq('rooms', criteria.rooms.exact)
                else:
                    if criteria.rooms.min is not None: query = query.gte('rooms', criteria.rooms.min)
                    if criteria.rooms.max is not None: query = query.lte('rooms', criteria.rooms.max)
            
            # ✅ فلتر الحمامات (كان ناقص!)
            if criteria.baths:
                if criteria.baths.exact is not None:
                    query = query.eq('baths', criteria.baths.exact)
                else:
                    if criteria.baths.min is not None: query = query.gte('baths', criteria.baths.min)
                    if criteria.baths.max is not None: query = query.lte('baths', criteria.baths.max)
            
            # ✅ فلتر الصالات (كان ناقص!)
            if criteria.halls:
                if criteria.halls.exact is not None:
                    query = query.eq('halls', criteria.halls.exact)
                else:
                    if criteria.halls.min is not None: query = query.gte('halls', criteria.halls.min)
                    if criteria.halls.max is not None: query = query.lte('halls', criteria.halls.max)
            
            # ✅ فلتر المساحة (كان ناقص!)
            if criteria.area_m2:
                if criteria.area_m2.min is not None: query = query.gte('area_m2', criteria.area_m2.min)
                if criteria.area_m2.max is not None: query = query.lte('area_m2', criteria.area_m2.max)
            
            if criteria.price:
                if criteria.price.min is not None: query = query.gte('price_num', criteria.price.min)
                if criteria.price.max is not None: query = query.lte('price_num', criteria.price.max)
            
            result = query.order('price_num').limit(self.exact_limit).execute()
            
            if not result.data:
                return []
            
            properties_data = result.data
            
            # تصفية إضافية للخدمات (للبحث العام مثل "أي مسجد")
            # ✅ strict=True للبحث المطابق - بدون أي تسامح!
            if criteria.metro_time_max or \
               (criteria.university_requirements and not criteria.university_requirements.university_name) or \
               (criteria.mosque_requirements and not criteria.mosque_requirements.mosque_name) or \
               (criteria.school_requirements and criteria.school_requirements.required):
                properties_data = self._filter_by_services(properties_data, criteria, strict=True)
            
            properties_data = self._add_nearby_services(properties_data, criteria)
            return properties_data
            
        except Exception as e:
            logger.error(f"خطأ في البحث الدقيق: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _flexible_search(self, criteria: PropertyCriteria) -> List[Dict[str, Any]]:
        """
        بحث هجين ذكي (Hybrid Search):
        يدمج بين البحث الدلالي (Vector) والبحث المكاني (Geospatial)
        """
        try:
            logger.info("🧠 بدء البحث الهجين (Smart Hybrid Search)...")
            
            # 1. تجهيز إحداثيات البحث (جامعة أو مسجد) إن وجدت
            target_lat = None
            target_lon = None
            
            if criteria.university_requirements and criteria.university_requirements.university_name:
                uni_name = criteria.university_requirements.university_name
                matched_name = _find_matching_university(uni_name) or uni_name
                loc = self._get_entity_location(matched_name, 'universities')
                if loc: target_lat, target_lon = loc
                
            elif criteria.mosque_requirements and criteria.mosque_requirements.mosque_name:
                loc = self._get_entity_location(criteria.mosque_requirements.mosque_name, 'mosques')
                if loc: target_lat, target_lon = loc

            # 2. محاولة البحث باستخدام المتجهات (إذا توفر نص أصلي من المستخدم)
            hybrid_results = []
            if criteria.original_query:
                try:
                    logger.info("توليد Embedding للنص...")
                    query_vector = embedding_generator.generate(criteria.original_query)
                    
                    if query_vector:
                        rpc_params = {
                            'query_embedding': query_vector,
                            'match_threshold': 0.5,
                            'match_count': 50,
                            'p_purpose': criteria.purpose.value,
                            'p_property_type': criteria.property_type.value,
                            'p_city': criteria.city,
                            'p_district': criteria.district,  # ✅ إضافة الحي!
                            'min_price': criteria.price.min * 0.7 if criteria.price and criteria.price.min else None,
                            'max_price': criteria.price.max * 1.3 if criteria.price and criteria.price.max else None,
                            'p_lat': target_lat,
                            'p_lon': target_lon
                        }
                        
                        logger.info("🚀 استدعاء search_properties_hybrid...")
                        result = self.db.client.rpc('search_properties_hybrid', rpc_params).execute()
                        hybrid_results = result.data or []
                except Exception as vec_error:
                    logger.error(f"فشل البحث المتجهي: {vec_error}")
                    hybrid_results = []

            # 3. Fallback: إذا لم نجد نتائج بالبحث الهجين، نلجأ للبحث الرقمي (Weighted)
            if not hybrid_results:
                logger.info("⚠️ استخدام البحث الرقمي البديل (Weighted Search)...")
                
                target_price = 0
                if criteria.price:
                    if criteria.price.min and criteria.price.max:
                        target_price = (criteria.price.min + criteria.price.max) / 2
                    elif criteria.price.max:
                        target_price = criteria.price.max
                    elif criteria.price.min:
                        target_price = criteria.price.min
                
                if target_price > 0:
                    try:
                        rpc_params = {
                            'target_price': target_price,
                            'target_lat': target_lat,
                            'target_lon': target_lon,
                            'p_purpose': criteria.purpose.value,
                            'p_property_type': criteria.property_type.value,
                            'p_city': criteria.city
                        }
                        # ملاحظة: يفترض أنك أنشأت search_properties_flexible_ranked في الخطوات السابقة
                        res = self.db.client.rpc('search_properties_flexible_ranked', rpc_params).execute()
                        hybrid_results = res.data or []
                    except Exception as e:
                        logger.error(f"فشل البحث الرقمي: {e}")

            if not hybrid_results:
                return []

            # 4. جلب التفاصيل الكاملة للعقارات
            ranked_ids = [str(item['id']) for item in hybrid_results]
            
            if not ranked_ids:
                return []

            properties_response = self.db.client.table('properties')\
                .select('*')\
                .in_('id', ranked_ids)\
                .execute()
            
            full_properties_map = {str(p['id']): p for p in properties_response.data}
            
            sorted_properties = []
            for item in hybrid_results:
                p_id = str(item['id'])
                if p_id in full_properties_map:
                    prop = full_properties_map[p_id]
                    # إضافة نسبة التطابق
                    prop['match_score'] = round(item.get('similarity', 0) * 100) if 'similarity' in item else 80
                    sorted_properties.append(prop)
            
            # 5. تصفية الخدمات (مع تسامح +5 دقائق للبحث المشابه)
            if criteria.metro_time_max or \
               (criteria.university_requirements and criteria.university_requirements.required) or \
               (criteria.mosque_requirements and criteria.mosque_requirements.required) or \
               (criteria.school_requirements and criteria.school_requirements.required):
                sorted_properties = self._filter_by_services(sorted_properties, criteria, strict=False)
            
            # 6. إضافة معلومات الخدمات القريبة للعرض
            sorted_properties = self._add_nearby_services(sorted_properties, criteria)
            
            return sorted_properties

        except Exception as e:
            logger.error(f"خطأ في البحث الهجين: {e}")
            return []
    
    def _filter_by_services(self, properties: List[Dict[str, Any]], criteria: PropertyCriteria, strict: bool = True) -> List[Dict[str, Any]]:
        """
        فلترة العقارات بناءً على الخدمات
        
        Args:
            properties: قائمة العقارات
            criteria: معايير البحث
            strict: True = بحث مطابق (بدون تسامح)، False = بحث مشابه (+5 دقائق تسامح)
        """
        filtered = []
        
        # ✅ التسامح الموحد للبحث المشابه: +5 دقائق لكل الخدمات
        TOLERANCE_MINUTES = 5
        
        for prop in properties:
            prop_lat = prop.get('final_lat')
            prop_lon = prop.get('final_lon')
            
            if not prop_lat or not prop_lon: continue
            
            # ═══════════════════════════════════════════════════════
            # ✅ الميترو
            # ═══════════════════════════════════════════════════════
            if criteria.metro_time_max:
                prop_metro_time = prop.get('time_to_metro_min')
                if prop_metro_time is not None:
                    if strict:
                        # البحث المطابق: الوقت المحدد بالضبط
                        if prop_metro_time > criteria.metro_time_max:
                            continue
                    else:
                        # البحث المشابه: +5 دقائق تسامح
                        if prop_metro_time > (criteria.metro_time_max + TOLERANCE_MINUTES):
                            continue
            
            # ═══════════════════════════════════════════════════════
            # ✅ الجامعات (بحث عام)
            # ═══════════════════════════════════════════════════════
            if criteria.university_requirements and criteria.university_requirements.required:
                uni_reqs = criteria.university_requirements
                if not uni_reqs.university_name:
                    max_minutes = uni_reqs.max_distance_minutes or 20
                    if strict:
                        max_dist = _minutes_to_meters(max_minutes)
                    else:
                        # +5 دقائق تسامح
                        max_dist = _minutes_to_meters(max_minutes + TOLERANCE_MINUTES)
                    try:
                        res = self.db.client.rpc('get_universities_for_display', {
                            'center_lat': prop_lat, 'center_lon': prop_lon,
                            'max_distance_meters': max_dist, 'university_name': None
                        }).execute()
                        if not res.data: continue
                    except: continue

            # ═══════════════════════════════════════════════════════
            # ✅ المساجد (بحث عام)
            # ═══════════════════════════════════════════════════════
            if criteria.mosque_requirements and criteria.mosque_requirements.required:
                mosque_reqs = criteria.mosque_requirements
                if not mosque_reqs.mosque_name:
                    max_minutes = mosque_reqs.max_distance_minutes or 10
                    if strict:
                        max_dist = _minutes_to_meters(max_minutes, walking=mosque_reqs.walking)
                    else:
                        # +5 دقائق تسامح
                        max_dist = _minutes_to_meters(max_minutes + TOLERANCE_MINUTES, walking=mosque_reqs.walking)
                    try:
                        res = self.db.client.rpc('get_mosques_for_display', {
                            'center_lat': prop_lat, 'center_lon': prop_lon,
                            'max_distance_meters': max_dist, 'mosque_name': None
                        }).execute()
                        if not res.data: continue
                    except: continue
            
            # ═══════════════════════════════════════════════════════
            # ✅ المدارس (بحث عام)
            # ═══════════════════════════════════════════════════════
            if criteria.school_requirements and criteria.school_requirements.required:
                school_reqs = criteria.school_requirements
                max_minutes = school_reqs.max_distance_minutes or 15
                if strict:
                    max_dist = _minutes_to_meters(max_minutes, walking=school_reqs.walking)
                else:
                    # +5 دقائق تسامح
                    max_dist = _minutes_to_meters(max_minutes + TOLERANCE_MINUTES, walking=school_reqs.walking)
                
                # تحويل الجنس والمراحل
                gender = None
                if school_reqs.gender:
                    gender = 'girls' if school_reqs.gender.value == 'بنات' else 'boys' if school_reqs.gender.value == 'بنين' else None
                
                levels = None
                if school_reqs.levels:
                    levels = [LEVELS_TRANSLATION_MAP.get(l, l) for l in school_reqs.levels]
                
                try:
                    res = self.db.client.rpc('get_nearby_schools', {
                        'p_lat': prop_lat, 'p_lon': prop_lon,
                        'p_distance_meters': max_dist,
                        'p_gender': gender, 'p_levels': levels
                    }).execute()
                    if not res.data: continue
                except: continue
            
            filtered.append(prop)
        return filtered
    
    def _add_nearby_services(self, properties: List[Dict[str, Any]], criteria: PropertyCriteria) -> List[Dict[str, Any]]:
        """إضافة معلومات الخدمات القريبة"""
        if not properties: return []
        
        for prop in properties:
            prop_lat = prop.get('final_lat')
            prop_lon = prop.get('final_lon')
            if not prop_lat or not prop_lon: continue
            
            if criteria.school_requirements and criteria.school_requirements.required:
                prop['nearby_schools'] = self._get_nearby_schools(prop_lat, prop_lon, criteria.school_requirements)
            
            if criteria.university_requirements and criteria.university_requirements.required:
                prop['nearby_universities'] = self._get_nearby_universities_for_display(prop_lat, prop_lon, criteria.university_requirements)
                
            if criteria.mosque_requirements and criteria.mosque_requirements.required:
                 prop['nearby_mosques'] = self._get_nearby_mosques_for_display(prop_lat, prop_lon, criteria.mosque_requirements)
                 
        return properties

    def _get_nearby_schools(self, lat, lon, reqs):
        try:
            dist = _minutes_to_meters(reqs.max_distance_minutes or 15, walking=reqs.walking)
            levels = [LEVELS_TRANSLATION_MAP.get(l, l) for l in reqs.levels] if reqs.levels else None
            gender = 'girls' if reqs.gender == 'بنات' else 'boys' if reqs.gender == 'بنين' else None
            
            res = self.db.client.rpc('get_nearby_schools', {
                'p_lat': lat, 'p_lon': lon, 'p_distance_meters': dist,
                'p_gender': gender, 'p_levels': levels
            }).execute()
            return res.data if res.data else []
        except: return []

    def _get_nearby_universities_for_display(self, lat, lon, reqs):
        try:
            dist = _minutes_to_meters((reqs.max_distance_minutes or 15) + 5)
            uni_name = _find_matching_university(reqs.university_name) if reqs.university_name else None
            
            res = self.db.client.rpc('get_universities_for_display', {
                'center_lat': lat, 'center_lon': lon,
                'max_distance_meters': dist, 'university_name': uni_name
            }).execute()
            
            data = res.data or []
            for item in data:
                d = item.get('distance_meters', 0)
                item['drive_minutes'] = round((d / 1000.0) / 30.0 * 60.0, 1)
            return data
        except: return []

    def _get_nearby_mosques_for_display(self, lat, lon, reqs):
        try:
            dist = _minutes_to_meters((reqs.max_distance_minutes or 5) + 2, walking=reqs.walking)
            
            res = self.db.client.rpc('get_mosques_for_display', {
                'center_lat': lat, 'center_lon': lon,
                'max_distance_meters': dist, 'mosque_name': reqs.mosque_name
            }).execute()
            
            data = res.data or []
            for item in data:
                d = item.get('distance_meters', 0)
                if reqs.walking:
                    item['walk_minutes'] = round((d / 1000.0) / 5.0 * 60.0, 1)
                else:
                    item['drive_minutes'] = round((d / 1000.0) / 30.0 * 60.0, 1)
            return data
        except: return []

    def _row_to_property(self, row: Dict[str, Any]) -> Property:
        return Property(
            id=str(row.get('id')),
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
            nearby_mosques=row.get('nearby_mosques', []),
            match_score=row.get('match_score') # إضافة درجة التطابق إذا وجدت
        )


# إنشاء instance واحد
search_engine = SearchEngine()
