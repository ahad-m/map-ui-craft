"""
وحدة استخراج معايير البحث من طلب المستخدم باستخدام النموذج اللغوي
النسخة المحدّثة - مع دعم المساجد وتوحيد أسماء الجامعات
"""
from openai import OpenAI
from config import settings
from models import (
    PropertyCriteria, PropertyPurpose, PropertyType, PricePeriod,
    RangeFilter, IntRangeFilter, PriceFilter, SchoolRequirements,
    UniversityRequirements, MosqueRequirements,
    CriteriaExtractionResponse
)
import json
import logging

logger = logging.getLogger(__name__)

# القائمة الرسمية للجامعات (للتوحيد)
OFFICIAL_UNIVERSITIES = [
    "مركز الملك عبدالله للدراسات البترولية والبحوث",
    "كلية العناية الطبية",
    "كلية العلوم والدراسات الإنسانية برماح",
    "كلية المجتمع الجديدة",
    "كليات البنات حريملاء",
    "جامعة الملك سعود فرع المزاحمية",
    "كلية المجتمع في الافلاج",
    "جامعة الملك سعود",
    "كلية التقنية بالرياض بنات",
    "معهد الإدارة العامة الفرع النسائي",
    "جامعة المجمعة فرع الزلفي",
    "كلية العلوم والدراسات الانسانية فرع البنات في ثادق",
    "جامعة الأمير سطام بن عبدالعزيز",
    "جامعة شقراء",
    "جامعة المجمعة",
    "جامعة رياض العلم",
    "الكلية التقنية الطلاب بالزلفي",
    "الكلية التقنية للبنات بالزلفي",
    "مجمع كليات البنات بجامعة الأمير سطام",
    "الجامعة العربية المفتوحة",
    "جامعة الملك سعود بن عبدالعزيز للعلوم الصحية",
    "جامعة الأمير سطام بن عبدالعزيز الخرج",
    "جامعة الإمام محمد بن سعود الإسلامية بحريملاء",
    "جامعة الملك سعود - بنات",
    "كلية التقنية بالرياض بنين",
    "مجمع الكليات الجامعية بمحافظة الدوادمي",
    "جامعة الإمام محمد إبن سعود",
    "المعهد السعودي للألكترونيات والأجهزة المنزلية",
    "جامعة الأمير سلطان",
    "جامعة الأميرة نورة بنت عبد الرحمن",
    "كلية الملك خالد العسكرية",
    "كلية التربية للبنات",
    "المعهد العلمي بالمجمعة",
    "كلية الملك فهد الأمنية",
    "معهد حرس الحدود",
    "جامعة الإمام محمد بن سعود الإسلامية المعهد العلمي في الملز",
    "كلية الشريعة والقانون جامعة المجمعة ( طلاب - طالبات ) بالغاط",
    "مدرسة سلاح الإشارة بالحرس الوطني",
    "جامعة نايف العربية للعلوم الأمنية",
    "الكلية التقنية المجمعة",
    "كلية الاتصالات والمعلومات",
    "كلية العلوم والدراسات الإنسانية بحوطة سدير",
    "الجامعة السعودية الإلكترونية",
    "جامعة الملك سعود كلية المجتمع طلاب",
    "جامعة الإمام محمد بن سعود الإسلامية كلية العلوم و الدراسات الإنسانية وكلية المجتمع حريملاء",
    "كلية الملك عبدالله بن عبدالعزيز للقيادة و الأركان",
    "كلية التقنية بالأرطاوية",
    "كلية التقنية بوادي الدواسر",
    "جامعة اليمامة",
    "الأكاديمية الوطنية للبناء",
    "الأكاديمية الوطنية للصناعات العسكرية",
    "المعهد العلمي بالدرعية",
    "جامعة الأمير سطام بن عبدالعزيز في وادي الدواسر",
    "جامعة الفيصل",
    "الكلية التقنية للسياحة و الفندقة بالمزاحمية"
]


class LLMParser:
    """محلل طلبات المستخدم باستخدام النموذج اللغوي"""
    
    def __init__(self):
        """تهيئة OpenAI client"""
        self.client = OpenAI()  # API key موجود في البيئة
        self.model = settings.LLM_MODEL
        
        # System prompt محدّث مع دعم المساجد وتوحيد الجامعات
        self.system_prompt = f"""أنت مساعد عقاري ذكي متخصص في فهم اللهجة السعودية والعربية الفصحى.
مهمتك استخراج معايير البحث عن العقارات من طلبات المستخدمين بدقة عالية.

## قاموس اللهجة السعودية:
- "ابي" / "ابغى" / "ودي" = أريد
- "اقصى شي" = الحد الأقصى
- "اقل شي" = الحد الأدنى
- "بحدود" = تقريباً / حوالي
- "تتراوح بين" / "من ... إلى" = نطاق
- "k" = ألف (1000)
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

## القرب والمسافات (مهم جداً):
- "قريب" / "قريبه" / "قريبة" / "قريبه من" / "قريبة من" = كلها تعني "near/close to"
- "د" / "دقيقة" / "دقيقه" / "دقائق" / "دقايق" = minutes
- "بالسيارة" / "بالسياره" / "بالعربية" = by car (القيادة)
- "مشي" / "سير" / "على الاقدام" / "مشياً" = walking
- أمثلة: "15 د بالسياره" = 15 minutes by car
- أمثلة: "10 دقائق مشي" = 10 minutes walking
- أمثلة: "قريبه من الجامعه" = near the university

## ═══════════════════════════════════════════════════════════
## الجامعات - توحيد الأسماء (مهم جداً جداً!)
## ═══════════════════════════════════════════════════════════

**القائمة الرسمية للجامعات:**
{json.dumps(OFFICIAL_UNIVERSITIES, ensure_ascii=False, indent=2)}

**قواعد توحيد أسماء الجامعات:**
1. إذا ذكر المستخدم اسم جامعة (كامل أو مختصر)، يجب أن تجد الاسم الرسمي المطابق من القائمة أعلاه
2. يجب أن يكون الاسم في university_requirements.university_name مطابقاً حرفياً للاسم الرسمي
3. تجاهل الفروقات البسيطة في الإملاء (الهمزات، التاء المربوطة/الهاء، المسافات)
4. إذا ذكر المستخدم اسماً مختصراً، ابحث عن الاسم الكامل في القائمة

**أمثلة على التوحيد:**
- "جامعة الامام" → "جامعة الإمام محمد إبن سعود"
- "جامعه الملك سعود" → "جامعة الملك سعود"
- "جامعة الاميرة نوره" → "جامعة الأميرة نورة بنت عبد الرحمن"
- "الملك سعود" → "جامعة الملك سعود"
- "نوره" → "جامعة الأميرة نورة بنت عبد الرحمن"

## ═══════════════════════════════════════════════════════════
## المساجد - ميزة جديدة (مهم!)
## ═══════════════════════════════════════════════════════════

**قواعد معالجة المساجد:**
1. إذا ذكر المستخدم "مسجد" أو "جامع"، فعّل mosque_requirements.required = true
2. إذا ذكر اسم مسجد محدد (مثل "مسجد الراجحي")، ضعه في mosque_requirements.mosque_name
3. إذا قال "أي مسجد" أو "مسجد قريب" بدون تحديد الاسم، اترك mosque_requirements.mosque_name = null
4. استخرج المسافة بالدقائق في mosque_requirements.max_distance_minutes
5. حدد نوع الحركة: إذا ذكر "مشي" أو "سير"، ضع mosque_requirements.walking = true
6. إذا ذكر "بالسيارة" أو لم يحدد، ضع mosque_requirements.walking = false (افتراضياً)
7. الوقت الافتراضي للمساجد: 5 دقائق مشياً إذا لم يُذكر

**أمثلة على المساجد:**
- "ابي شقة قريبة من مسجد" → mosque_name = null, max_distance_minutes = 5, walking = true
- "فيلا قريبة من مسجد الراجحي" → mosque_name = "مسجد الراجحي", max_distance_minutes = 5, walking = true
- "عقار خلال 10 دقايق مشي من جامع" → mosque_name = null, max_distance_minutes = 10, walking = true
- "بيت بجانب مسجد الملك فهد خلال 3 دقائق بالسيارة" → mosque_name = "مسجد الملك فهد", max_distance_minutes = 3, walking = false

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
10. الوقت الافتراضي للجامعات: 15 دقيقة بالسيارة إذا لم يُذكر
11. الوقت الافتراضي للمساجد: 5 دقائق مشياً إذا لم يُذكر
12. افهم جميع أشكال الكلمات (تاء مربوطة، هاء، مع أو بدون همزات ونقاط)

استخرج المعايير بدقة وحول جميع القيم إلى الصيغة المعيارية."""
    
    def extract_criteria(self, user_query: str) -> CriteriaExtractionResponse:
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
                                "university_name": {"type": "string", "description": "الاسم الرسمي الكامل للجامعة من القائمة المحددة"},
                                "max_distance_minutes": {"type": "number", "description": "أقصى وقت للوصول للجامعة بالدقائق"}
                            }
                        },
                        "mosque_requirements": {
                            "type": "object",
                            "properties": {
                                "required": {"type": "boolean", "description": "هل طلب المستخدم القرب من مسجد؟"},
                                "mosque_name": {"type": "string", "description": "اسم المسجد المحدد (أو null لأي مسجد)"},
                                "max_distance_minutes": {"type": "number", "description": "أقصى وقت للوصول للمسجد بالدقائق"},
                                "walking": {"type": "boolean", "description": "true = مشياً، false = بالسيارة"}
                            }
                        }
                    },
                    "required": ["purpose", "property_type"]
                }
            }]
            
            # استدعاء النموذج اللغوي
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_query}
                ],
                functions=functions,
                function_call={"name": "extract_property_criteria"},
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
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
            university_requirements = UniversityRequirements(**data['university_requirements'])
        
        # معالجة متطلبات المساجد (جديد)
        mosque_requirements = None
        if data.get('mosque_requirements'):
            mosque_requirements = MosqueRequirements(**data['mosque_requirements'])
        
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
            mosque_requirements=mosque_requirements,  # جديد
            original_query=original_query
        )
    
    def _generate_confirmation_message(self, criteria: PropertyCriteria) -> str:
        """توليد رسالة تأكيد المعايير المستخرجة"""
        
        message = "فهمت طلبك! 👍\n\nتبحث عن:\n"
        
        # نوع العقار والغرض
        message += f"• {criteria.property_type.value} {criteria.purpose.value}\n"
        
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
                uni_text += f" {criteria.university_requirements.university_name}"
            if criteria.university_requirements.max_distance_minutes:
                uni_text += f" (≤{criteria.university_requirements.max_distance_minutes:.0f} دقيقة)"
            message += uni_text + "\n"
        
        # المساجد (جديد)
        if criteria.mosque_requirements and criteria.mosque_requirements.required:
            mosque_text = "• قريب من مسجد"
            if criteria.mosque_requirements.mosque_name:
                mosque_text += f" {criteria.mosque_requirements.mosque_name}"
            if criteria.mosque_requirements.max_distance_minutes:
                movement_type = "مشياً" if criteria.mosque_requirements.walking else "بالسيارة"
                mosque_text += f" (≤{criteria.mosque_requirements.max_distance_minutes:.0f} دقيقة {movement_type})"
            message += mosque_text + "\n"
        
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
