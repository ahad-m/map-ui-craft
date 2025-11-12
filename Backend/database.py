"""
وحدة الاتصال بقاعدة البيانات Supabase
"""
from supabase import create_client, Client
from config import settings
from typing import Optional, List, Dict, Any
import logging
from models import SchoolRequirements, UniversityRequirements # <-- إضافة مهمة

logger = logging.getLogger(__name__)


class Database:
    """مدير قاعدة البيانات"""
    
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
        """
        try:
            result = self.client.table('properties').select('*').eq('id', property_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"خطأ في الحصول على العقار: {e}")
            raise

    # ==========================================================
    # !! الدوال الجديدة للبحث الجغرافي !!
    # ==========================================================

    def check_school_proximity(self, lat: float, lon: float, reqs: SchoolRequirements) -> bool:
        """
        التحقق من وجود مدرسة تطابق المتطلبات بالقرب من العقار
        """
        try:
            # استدعاء دالة RPC في Supabase
            result = self.client.rpc(
                'find_schools_near_location',
                {
                    'prop_lat': lat,
                    'prop_lon': lon,
                    'max_minutes': reqs.proximity_minutes or settings.DEFAULT_PROXIMITY_MINUTES, # (سنضيف هذا في config)
                    'req_gender': reqs.gender.value if reqs.gender else None,
                    'req_level': reqs.level.value if reqs.level else None,
                    'req_name': reqs.name
                }
            ).execute()
            
            # الدالة ترجع true إذا وجدت، و false إذا لم تجد
            return result.data
            
        except Exception as e:
            logger.error(f"خطأ في التحقق من قرب المدارس: {e}")
            return False # نفترض عدم وجودها في حالة الخطأ

    def check_university_proximity(self, lat: float, lon: float, reqs: UniversityRequirements) -> bool:
        """
        التحقق من وجود جامعة تطابق المتطلبات بالقرب من العقار
        """
        try:
            # استدعاء دالة RPC في Supabase
            result = self.client.rpc(
                'find_universities_near_location',
                {
                    'prop_lat': lat,
                    'prop_lon': lon,
                    'max_minutes': reqs.proximity_minutes or settings.DEFAULT_PROXIMITY_MINUTES,
                    'req_name': reqs.name
                }
            ).execute()
            
            # الدالة ترجع true إذا وجدت، و false إذا لم تجد
            return result.data
            
        except Exception as e:
            logger.error(f"خطأ في التحقق من قرب الجامعات: {e}")
            return False # نفترض عدم وجودها في حالة الخطأ
    
    # ----------------------------------------------------
    # (هذه الدوال القديمة يمكن حذفها أو تركها)
    # ----------------------------------------------------
    
    def get_schools_near_location(self, lat: float, lon: float, max_distance_km: float = 5, 
                                  gender: Optional[str] = None, levels: Optional[list] = None):
        """
        (دالة قديمة - سيتم استبدالها بالـ RPC)
        """
        logger.warning("يتم استدعاء دالة قديمة (get_schools_near_location)")
        return []
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        (دالة قديمة - الحساب يتم الآن في PostGIS)
        """
        from math import radians, sin, cos, sqrt, atan2
        R = 6371
        lat1_rad, lat2_rad = radians(lat1), radians(lat2)
        delta_lat, delta_lon = radians(lat2 - lat1), radians(lon2 - lon1)
        a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        return R * c


# إنشاء instance عام من Database
db = Database()
