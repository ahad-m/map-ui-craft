"""
نماذج البيانات (Pydantic Models) للمساعد العقاري الذكي
النسخة المحدّثة - مع إضافة حقول الخدمات القريبة (Fix)
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from enum import Enum


class PropertyPurpose(str, Enum):
    """الغرض من العقار"""
    SALE = "للبيع"
    RENT = "للايجار"


class PropertyType(str, Enum):
    """نوع العقار"""
    VILLA = "فلل"
    HOUSE = "بيت"
    APARTMENT = "شقق"
    STUDIO = "استوديو"
    FLOOR = "دور"
    TOWNHOUSE = "تاون هاوس"
    DUPLEX = "دوبلكس"
    BUILDING = "عمائر"


class PricePeriod(str, Enum):
    """فترة السعر"""
    YEARLY = "سنوي"
    MONTHLY = "شهري"
    DAILY = "يومي"


class SchoolGender(str, Enum):
    """جنس المدرسة"""
    BOYS = "بنين"
    GIRLS = "بنات"
    MIXED = "مختلط"


class RangeFilter(BaseModel):
    """فلتر نطاق (من-إلى)"""
    min: Optional[float] = None
    max: Optional[float] = None
    exact: Optional[float] = None


class IntRangeFilter(BaseModel):
    """فلتر نطاق صحيح (من-إلى)"""
    min: Optional[int] = None
    max: Optional[int] = None
    exact: Optional[int] = None


class PriceFilter(BaseModel):
    """فلتر السعر"""
    min: Optional[float] = None
    max: Optional[float] = None
    currency: str = "SAR"
    period: Optional[PricePeriod] = None


class SchoolRequirements(BaseModel):
    """متطلبات المدارس"""
    required: bool = False
    levels: Optional[List[str]] = None
    gender: Optional[SchoolGender] = None
    max_distance_minutes: Optional[float] = None
    walking: bool = False


class UniversityRequirements(BaseModel):
    """متطلبات الجامعات"""
    required: bool = False
    university_name: Optional[str] = None
    max_distance_minutes: Optional[float] = None


class MosqueRequirements(BaseModel):
    """متطلبات المساجد"""
    required: bool = False
    mosque_name: Optional[str] = None
    max_distance_minutes: Optional[float] = None
    walking: bool = True


class PropertyCriteria(BaseModel):
    """معايير البحث عن العقار المستخرجة من طلب المستخدم"""
    purpose: PropertyPurpose = Field(..., description="الغرض من العقار")
    property_type: PropertyType = Field(..., description="نوع العقار")
    district: Optional[str] = Field(None, description="اسم الحي")
    city: Optional[str] = Field(default="الرياض", description="المدينة")
    rooms: Optional[IntRangeFilter] = Field(None, description="عدد الغرف")
    baths: Optional[IntRangeFilter] = Field(None, description="عدد الحمامات")
    halls: Optional[IntRangeFilter] = Field(None, description="عدد الصالات")
    area_m2: Optional[RangeFilter] = Field(None, description="المساحة")
    price: Optional[PriceFilter] = Field(None, description="السعر")
    metro_time_max: Optional[float] = Field(None, description="الميترو")
    school_requirements: Optional[SchoolRequirements] = Field(None, description="المدارس")
    university_requirements: Optional[UniversityRequirements] = Field(None, description="الجامعات")
    mosque_requirements: Optional[MosqueRequirements] = Field(None, description="المساجد")
    original_query: Optional[str] = Field(None, description="النص الأصلي")


class SearchMode(str, Enum):
    EXACT = "exact"
    SIMILAR = "similar"


class Property(BaseModel):
    """نموذج العقار - تم إضافة حقول الخدمات القريبة"""
    id: str
    url: Optional[str] = None
    purpose: str
    property_type: str
    city: Optional[str] = None
    district: Optional[str] = None
    title: Optional[str] = None
    price_num: Optional[float] = None
    price_currency: Optional[str] = None
    price_period: Optional[str] = None
    area_m2: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    final_lat: Optional[float] = None
    final_lon: Optional[float] = None
    time_to_metro_min: Optional[float] = None
    rooms: Optional[int] = None
    baths: Optional[int] = None
    halls: Optional[int] = None
    
    # [هام] الحقول الجديدة للخدمات القريبة
    nearby_schools: Optional[List[Dict[str, Any]]] = []
    nearby_universities: Optional[List[Dict[str, Any]]] = []
    nearby_mosques: Optional[List[Dict[str, Any]]] = []
    
    # نقاط التطابق
    match_score: Optional[float] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class UserQuery(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class SearchModeSelection(BaseModel):
    mode: SearchMode
    criteria: PropertyCriteria


class SearchResponse(BaseModel):
    success: bool
    message: str
    criteria: Optional[PropertyCriteria] = None
    properties: List[Property] = []
    total_count: int = 0
    search_mode: Optional[SearchMode] = None


class CriteriaExtractionResponse(BaseModel):
    success: bool
    message: str
    criteria: Optional[PropertyCriteria] = None
    needs_clarification: bool = False
    clarification_questions: Optional[List[str]] = None
