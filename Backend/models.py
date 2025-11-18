"""
نماذج البيانات (Pydantic Models) للمساعد العقاري الذكي
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
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
    levels: Optional[List[str]] = None  # مثل: ["ابتدائي", "متوسط", "ثانوي"]
    gender: Optional[SchoolGender] = None
    max_distance_minutes: Optional[float] = None  # بالدقائق (بالسيارة)


class UniversityRequirements(BaseModel):
    """متطلبات الجامعات"""
    required: bool = False
    university_name: Optional[str] = None  # اسم الجامعة المحددة
    max_distance_minutes: Optional[float] = None  # بالدقائق (بالسيارة)


class PropertyCriteria(BaseModel):
    """معايير البحث عن العقار المستخرجة من طلب المستخدم"""
    
    # معايير إلزامية
    purpose: PropertyPurpose = Field(..., description="الغرض من العقار (بيع أو إيجار)")
    property_type: PropertyType = Field(..., description="نوع العقار")
    
    # معايير اختيارية
    district: Optional[str] = Field(None, description="اسم الحي")
    city: Optional[str] = Field(default="الرياض", description="المدينة")
    
    # المواصفات
    rooms: Optional[IntRangeFilter] = Field(None, description="عدد الغرف")
    baths: Optional[IntRangeFilter] = Field(None, description="عدد الحمامات")
    halls: Optional[IntRangeFilter] = Field(None, description="عدد الصالات")
    area_m2: Optional[RangeFilter] = Field(None, description="المساحة بالمتر المربع")
    price: Optional[PriceFilter] = Field(None, description="السعر")
    
    # القرب من الخدمات
    metro_time_max: Optional[float] = Field(None, description="أقصى وقت للوصول لمحطة المترو بالدقائق")
    school_requirements: Optional[SchoolRequirements] = Field(None, description="متطلبات المدارس")
    university_requirements: Optional[UniversityRequirements] = Field(None, description="متطلبات الجامعات")
    
    # النص الأصلي للطلب (للبحث الدلالي)
    original_query: Optional[str] = Field(None, description="النص الأصلي لطلب المستخدم")


class SearchMode(str, Enum):
    """نوع البحث"""
    EXACT = "exact"  # بس المطابق
    SIMILAR = "similar"  # اللي يشبهه


class Property(BaseModel):
    """نموذج العقار"""
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
    
    # نقاط التطابق (للبحث المشابه)
    match_score: Optional[float] = None


class ChatMessage(BaseModel):
    """رسالة في المحادثة"""
    role: Literal["user", "assistant", "system"]
    content: str


class UserQuery(BaseModel):
    """طلب المستخدم"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class SearchModeSelection(BaseModel):
    """اختيار نوع البحث من المستخدم"""
    mode: SearchMode
    criteria: PropertyCriteria


class SearchResponse(BaseModel):
    """استجابة البحث"""
    success: bool
    message: str
    criteria: Optional[PropertyCriteria] = None
    properties: List[Property] = []
    total_count: int = 0
    search_mode: Optional[SearchMode] = None


class CriteriaExtractionResponse(BaseModel):
    """استجابة استخراج المعايير"""
    success: bool
    message: str
    criteria: Optional[PropertyCriteria] = None
    needs_clarification: bool = False
    clarification_questions: Optional[List[str]] = None
