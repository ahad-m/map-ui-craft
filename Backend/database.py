"""
وحدة الاتصال بقاعدة البيانات Supabase
"""
from supabase import create_client, Client
from config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Database:
    """مدير قاعدة البيانات (الغرض: إنشاء اتصال مع Supabase عند بدء التطبيق)"""
    
    def __init__(self):
        """تهيئة الاتصال بـ Supabase"""
        try:
            self.client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("تم الاتصال بـ Supabase بنجاح")
        except Exception as e:
            logger.error(f"خطأ في الاتصال بـ Supabase: {e}")
            raise
    
    def get_client(self) -> Client:
        """الحصول على client الخاص بـ Supabase"""
        return self.client
    
    def execute_query(self, query: str, params: Optional[dict] = None):
        """
        تنفيذ استعلام SQL مباشر
        
        Args:
            query: استعلام SQL
            params: المعاملات (اختياري)
        
        Returns:
            نتائج الاستعلام
        """
        try:
            result = self.client.rpc('execute_sql', {
                'query': query,
                'params': params or {}
            })
            return result
        except Exception as e:
            logger.error(f"خطأ في تنفيذ الاستعلام: {e}")
            raise
    
    def get_properties(self, filters: dict, limit: int = 20):
        """
        الحصول على العقارات بناءً على الفلاتر
        
        Args:
            filters: قاموس الفلاتر
            limit: الحد الأقصى للنتائج
        
        Returns:
            قائمة العقارات
        """
        try:
            query = self.client.table('properties').select('*')
            
            # تطبيق الفلاتر
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
            
            # تحديد عدد النتائج
            query = query.limit(limit)
            
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"خطأ في الحصول على العقارات: {e}")
            raise
    
    def get_property_by_id(self, property_id: str):
        """
        الحصول على عقار بواسطة ID
        
        Args:
            property_id: معرف العقار
        
        Returns:
            بيانات العقار
        """
        try:
            result = self.client.table('properties').select('*').eq('id', property_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"خطأ في الحصول على العقار: {e}")
            raise
    
    def get_schools_near_location(self, lat: float, lon: float, max_distance_km: float = 5, 
                                  gender: Optional[str] = None, levels: Optional[list] = None):
        """
        الحصول على المدارس القريبة من موقع معين
        
        Args:
            lat: خط العرض
            lon: خط الطول
            max_distance_km: المسافة القصوى بالكيلومتر
            gender: جنس المدرسة (اختياري)
            levels: المراحل الدراسية (اختياري)
        
        Returns:
            قائمة المدارس القريبة
        """
        try:
            # ملاحظة: يحتاج إلى دالة PostGIS لحساب المسافة
            # هذا مثال بسيط، يمكن تحسينه باستخدام RPC function
            query = self.client.table('schools').select('*')
            
            if gender:
                query = query.eq('gender', gender)
            
            result = query.execute()
            
            # فلترة حسب المسافة (بشكل تقريبي)
            # في الإنتاج، يُفضل استخدام PostGIS
            schools = []
            for school in result.data:
                if school.get('lat') and school.get('lon'):
                    # حساب المسافة التقريبية
                    distance = self._calculate_distance(lat, lon, school['lat'], school['lon'])
                    if distance <= max_distance_km:
                        school['distance_km'] = distance
                        schools.append(school)
            
            return sorted(schools, key=lambda x: x['distance_km'])
        except Exception as e:
            logger.error(f"خطأ في الحصول على المدارس: {e}")
            raise
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        حساب المسافة التقريبية بين نقطتين (Haversine formula)
        
        Args:
            lat1, lon1: إحداثيات النقطة الأولى
            lat2, lon2: إحداثيات النقطة الثانية
        
        Returns:
            المسافة بالكيلومتر
        """
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # نصف قطر الأرض بالكيلومتر
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c


# إنشاء instance عام من Database
db = Database()
