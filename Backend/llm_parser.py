"""
وحدة استخراج معايير البحث من طلب المستخدم باستخدام النموذج اللغوي
"""
from openai import OpenAI
from config import settings
from models import (
    PropertyCriteria, PropertyPurpose, PropertyType, PricePeriod,
    RangeFilter, IntRangeFilter, PriceFilter, SchoolRequirements, UniversityRequirements,
    CriteriaExtractionResponse
)
import json
import logging

logger = logging.getLogger(__name__)


class LLMParser:
    """محلل طلبات المستخدم باستخدام النموذج اللغوي"""
    
    def __init__(self):
        """تهيئة OpenAI client"""
        self.client = OpenAI()  # API key موجود في البيئة
        self.model = settings.LLM_MODEL
        
        # System prompt متخصص لفهم اللهجة السعودية
        self.system_prompt = """أنت مساعد عقاري ذكي متخصص في فهم اللهجة السعودية والعربية الفصحى.
مهمتك استخراج معايير البحث عن العقارات من طلبات المستخدمين بدقة عالية.
يجب عليك دمج المعايير المستخلصة من سجل المحادثة (History) مع المعايير الجديدة من طلب المستخدم الحالي.
إذا لم يحدد المستخدم الغرض (بيع/إيجار) أو نوع العقار (شقة/فيلا)، يجب عليك محاولة استنتاجها من سياق المحادثة أو تركها فارغة إذا لم يكن هناك سياق واضح.
لا تختر قيمة افتراضية إلا إذا كانت واضحة جداً من السياق.

## قاموس اللهجة السعودية:
- "ابي" / "ابغى" / "ودي" = أريد
- "اقصى شي" = الحد الأقصى
- "اقل شي" = الحد الأدنى
    - "بحدود" = تقريباً / حوالي
    - "تتراوح بين" / "من ... إلى" = نطاق
    - "k" = ألف (1000)
    
    ## القرب من الخدمات:
    - "قرب جامعة X" / "بجانب جامعة X" = UniversityRequirements (university_name=X, required=true)
    - "قرب مدرسة" = SchoolRequirements (required=true)
- "م" / "متر" = متر مربع

## أنواع العقارات (مع المرادفات):
- فيلا → "فلل"
- بيت → "بيت"
- شقة → "شقق"
- استوديو → "استوديو"
- دور → "دور"
- تاون هاوس → "تاون هاوس"
- دوبلكس → "دوبلكس"
- عمارة → "عمائر"

## الغرض:
- بيع / للبيع → "للبيع"
- إيجار / للإيجار / للايجار / تأجير → "للايجار"

## فترة السعر:
- سنوي / بالسنة / سنوياً → "سنوي"
- شهري / بالشهر / شهرياً → "شهري"
- يومي / باليوم / يومياً → "يومي"

## ملاحظات مهمة:
1. إذا ذكر المستخدم رقم واحد للغرف/الحمامات/الصالات، ضعه في "exact"
2. إذا ذكر "اقل شي X"، ضع X في "min" فقط
3. إذا ذكر "اقصى شي X"، ضع X في "max" فقط
4. إذا ذكر نطاق (من X إلى Y)، ضع X في "min" و Y في "max"
5. السعر بالريال السعودي (SAR) ما لم يُذكر خلاف ذلك
6. المساحة بالمتر المربع
7. وقت المترو بالدقائق
8. إذا لم يُذكر الحي، اترك district فارغاً (null)
9. احفظ النص الأصلي في original_query

استخرج المعايير بدقة وحول جميع القيم إلى الصيغة المعيارية."""
    
    def extract_criteria(self, user_query: str, history: list = None) -> CriteriaExtractionResponse:
        """
        استخراج معايير البحث من طلب المستخدم
        
        Args:
            user_query: طلب المستخدم النصي
        
        Returns:
            CriteriaExtractionResponse يحتوي على المعايير المستخرجة
        """
        try:
            # تعريف function للاستخراج المنظم
            functions = [{
                "name": "extract_property_criteria",
                "description": "استخراج معايير البحث عن العقار من طلب المستخدم",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "purpose": {
                            "type": "string",
                            "enum": ["للبيع", "للايجار"],
                            "description": "الغرض من العقار (بيع أو إيجار)"
                        },
                        "property_type": {
                            "type": "string",
                            "enum": ["فلل", "بيت", "شقق", "استوديو", "دور", "تاون هاوس", "دوبلكس", "عمائر"],
                            "description": "نوع العقار"
                        },
                        "district": {
                            "type": "string",
                            "description": "اسم الحي (إذا ذُكر)"
                        },
                        "rooms": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "integer", "description": "الحد الأدنى لعدد الغرف"},
                                "max": {"type": "integer", "description": "الحد الأقصى لعدد الغرف"},
                                "exact": {"type": "integer", "description": "عدد الغرف المحدد"}
                            }
                        },
                        "baths": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "integer"},
                                "max": {"type": "integer"},
                                "exact": {"type": "integer"}
                            }
                        },
                        "halls": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "integer"},
                                "max": {"type": "integer"},
                                "exact": {"type": "integer"}
                            }
                        },
                        "area_m2": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "number", "description": "الحد الأدنى للمساحة بالمتر المربع"},
                                "max": {"type": "number", "description": "الحد الأقصى للمساحة بالمتر المربع"}
                            }
                        },
                        "price": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "number", "description": "الحد الأدنى للسعر"},
                                "max": {"type": "number", "description": "الحد الأقصى للسعر"},
                                "currency": {"type": "string", "default": "SAR"},
                                "period": {"type": "string", "enum": ["سنوي", "شهري", "يومي"]}
                            }
                        },
                        "metro_time_max": {
                            "type": "number",
                            "description": "أقصى وقت للوصول لمحطة المترو بالدقائق"
                        },
                        "school_requirements": {
                            "type": "object",
                            "properties": {
                                "required": {"type": "boolean"},
                                "levels": {"type": "array", "items": {"type": "string"}},
                                "gender": {"type": "string", "enum": ["بنين", "بنات", "مختلط"]},
                                "max_distance_minutes": {"type": "number"}
                            }
                        },
                        "university_requirements": {
                            "type": "object",
                            "properties": {
                                "required": {"type": "boolean"},
                                "university_name": {"type": "string", "description": "اسم الجامعة المطلوب القرب منها"},
                                "max_distance_minutes": {"type": "number"}
                            }
                        }
                    },
                    "required": ["purpose", "property_type"]
                }
            }]
            
            # بناء سجل المحادثة للنموذج اللغوي
            messages = [{"role": "system", "content": self.system_prompt}]
            if history:
                messages.extend(history)
            messages.append({"role": "user", "content": user_query})

            # استدعاء النموذج اللغوي
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                functions=functions,
                function_call={"name": "extract_property_criteria"},
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS ,
                timeout=30.0
            )
            
            # استخراج النتيجة
            function_call = response.choices[0].message.function_call
            if not function_call:
                return CriteriaExtractionResponse(
                    success=False,
                    message="لم أتمكن من فهم طلبك. هل يمكنك توضيحه أكثر؟",
                    needs_clarification=True,
                    clarification_questions=[
                        "هل تبحث عن عقار للبيع أو للإيجار؟",
                        "ما نوع العقار الذي تبحث عنه؟ (فيلا، شقة، بيت، إلخ)"
                    ]
                )
            
            # تحويل النتيجة إلى dict
            criteria_dict = json.loads(function_call.arguments)
            
            # تحويل الـ dict إلى PropertyCriteria
            criteria = self._dict_to_criteria(criteria_dict, user_query)
            
            # التحقق من اكتمال المعايير الأساسية
            if not criteria.purpose or not criteria.property_type:
                return CriteriaExtractionResponse(
                    success=False,
                    message="أحتاج معلومات إضافية لمساعدتك بشكل أفضل.",
                    criteria=criteria,
                    needs_clarification=True,
                    clarification_questions=self._generate_clarification_questions(criteria)
                )
            
            # نجح الاستخراج
            return CriteriaExtractionResponse(
                success=True,
                message=self._generate_confirmation_message(criteria),
                criteria=criteria,
                needs_clarification=False
            )
            
        except Exception as e:
            logger.error(f"خطأ في استخراج المعايير: {e}")
            return CriteriaExtractionResponse(
                success=False,
                message=f"حدث خطأ في معالجة طلبك. الرجاء المحاولة مرة أخرى.",
                needs_clarification=True
            )
    
    def _dict_to_criteria(self, data: dict, original_query: str) -> PropertyCriteria:
        """تحويل dict إلى PropertyCriteria"""
        
        # معالجة الحقول المعقدة
        rooms = None
        if data.get('rooms'):
            rooms = IntRangeFilter(**data['rooms'])
        
        baths = None
        if data.get('baths'):
            baths = IntRangeFilter(**data['baths'])
        
        halls = None
        if data.get('halls'):
            halls = IntRangeFilter(**data['halls'])
        
        area_m2 = None
        if data.get('area_m2'):
            area_m2 = RangeFilter(**data['area_m2'])
        
        price = None
        if data.get('price'):
            price = PriceFilter(**data['price'])
        
        school_requirements = None
        if data.get('school_requirements'):
            school_requirements = SchoolRequirements(**data['school_requirements'])
        
        university_requirements = None
        if data.get('university_requirements'):
            uni_data = data['university_requirements']
            # ضمان تعيين required=True إذا تم ذكر اسم الجامعة ولكن لم يتم تعيين required صراحة
            if uni_data.get('university_name') and uni_data.get('required') is None:
                uni_data['required'] = True
            university_requirements = UniversityRequirements(**uni_data)
        
        return PropertyCriteria(
            purpose=PropertyPurpose(data['purpose']),
            property_type=PropertyType(data['property_type']),
            district=data.get('district'),
            rooms=rooms,
            baths=baths,
            halls=halls,
            area_m2=area_m2,
            price=price,
            metro_time_max=data.get('metro_time_max'),
            school_requirements=school_requirements,
            university_requirements=university_requirements,
            original_query=original_query
        )
    
    def _generate_confirmation_message(self, criteria: PropertyCriteria) -> str:
        """توليد رسالة تأكيد المعايير المستخرجة"""
        
        message = "فهمت طلبك! 👍\n\nتبحث عن:\n"
        
            # نوع العقار والغرض
            if criteria.property_type and criteria.purpose:
                message += f"• {criteria.property_type.value} {criteria.purpose.value}\n"
            elif criteria.property_type:
                message += f"• {criteria.property_type.value}\n"
            elif criteria.purpose:
                message += f"• {criteria.purpose.value}\n"
        
        # الحي
        if criteria.district:
            message += f"• حي {criteria.district}\n"
        
        # الغرف والحمامات والصالات
        specs = []
        if criteria.rooms:
            if criteria.rooms.exact:
                specs.append(f"{criteria.rooms.exact} غرف")
            elif criteria.rooms.min and criteria.rooms.max:
                specs.append(f"{criteria.rooms.min}-{criteria.rooms.max} غرف")
            elif criteria.rooms.min:
                specs.append(f"≥{criteria.rooms.min} غرف")
        
        if criteria.baths:
            if criteria.baths.exact:
                specs.append(f"{criteria.baths.exact} حمامات")
            elif criteria.baths.min and criteria.baths.max:
                specs.append(f"{criteria.baths.min}-{criteria.baths.max} حمامات")
            elif criteria.baths.min:
                specs.append(f"≥{criteria.baths.min} حمامات")
        
        if criteria.halls:
            if criteria.halls.exact:
                specs.append(f"{criteria.halls.exact} صالة")
            elif criteria.halls.min:
                specs.append(f"≥{criteria.halls.min} صالة")
        
        if specs:
            message += f"• {', '.join(specs)}\n"
        
        # المساحة
        if criteria.area_m2:
            if criteria.area_m2.min and criteria.area_m2.max:
                message += f"• المساحة: {criteria.area_m2.min:.0f}-{criteria.area_m2.max:.0f} م²\n"
            elif criteria.area_m2.min:
                message += f"• المساحة: ≥{criteria.area_m2.min:.0f} م²\n"
            elif criteria.area_m2.max:
                message += f"• المساحة: ≤{criteria.area_m2.max:.0f} م²\n"
        
        # السعر
        if criteria.price:
            if criteria.price.min and criteria.price.max:
                period_text = f" {criteria.price.period.value}" if criteria.price.period else ""
                message += f"• الميزانية: {criteria.price.min:,.0f}-{criteria.price.max:,.0f} ريال{period_text}\n"
            elif criteria.price.max:
                period_text = f" {criteria.price.period.value}" if criteria.price.period else ""
                message += f"• الميزانية: ≤{criteria.price.max:,.0f} ريال{period_text}\n"
        
        # القرب من المترو
        if criteria.metro_time_max:
            message += f"• قريب من محطة مترو (≤{criteria.metro_time_max:.0f} دقيقة)\n"
        
        # المدارس
        if criteria.school_requirements and criteria.school_requirements.required:
            school_text = "• قريب من مدرسة"
            if criteria.school_requirements.levels:
                school_text += f" ({', '.join(criteria.school_requirements.levels)})"
            if criteria.school_requirements.gender:
                school_text += f" {criteria.school_requirements.gender.value}"
            if criteria.school_requirements.max_distance_minutes:
                school_text += f" (≤{criteria.school_requirements.max_distance_minutes:.0f} دقيقة)"
            message += school_text + "\n"
        
        # الجامعات
        if criteria.university_requirements and criteria.university_requirements.required:
            uni_text = "• قريب من جامعة"
            if criteria.university_requirements.university_name:
                uni_text += f" ({criteria.university_requirements.university_name})"
            if criteria.university_requirements.max_distance_minutes:
                uni_text += f" (≤{criteria.university_requirements.max_distance_minutes:.0f} دقيقة)"
            message += uni_text + "\n"
        
        message += "\nتبي بس المطابق لطلبك ولا عادي نقترح لك اللي يشبهه؟\nمتأكدين بيعجبك! 😊"
        
        return message
    
    def _generate_clarification_questions(self, criteria: PropertyCriteria) -> list:
        """توليد أسئلة توضيحية بناءً على المعايير الناقصة"""
        
        questions = []
        
        if not criteria.purpose:
            questions.append("هل تبحث عن عقار للبيع أو للإيجار؟")
        
        if not criteria.property_type:
            questions.append("ما نوع العقار الذي تبحث عنه؟ (فيلا، شقة، بيت، إلخ)")
        
        if not criteria.district:
            questions.append("في أي حي تفضل؟")
        
        if not criteria.price:
            questions.append("ما هي ميزانيتك المتاحة؟")
        
        return questions


# إنشاء instance عام من LLMParser
llm_parser = LLMParser()
