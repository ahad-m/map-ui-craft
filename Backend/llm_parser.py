"""
وحدة استخراج معايير البحث من طلب المستخدم باستخدام النموذج اللغوي
"""
from openai import OpenAI
from config import settings
from models import (
    PropertyCriteria, PropertyPurpose, PropertyType, PricePeriod,
    RangeFilter, IntRangeFilter, PriceFilter, 
    SchoolRequirements, UniversityRequirements, SchoolGender, SchoolLevel,
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

## قاموس اللهجة السعودية:
- "ابي" / "ابغى" / "ودي" = أريد
- "اقصى شي" = الحد الأقصى
- "اقل شي" = الحد الأدنى
- "بحدود" = تقريباً / حوالي
- "تتراوح بين" / "من ... إلى" = نطاق

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

# ==========================================================
# !! تعديل: إضافة قاموس ترجمة الإدخالات !!
# ==========================================================
## ترجمة قيم المدارس (Enums):
عند استدعاء الدالة، يجب عليك "ترجمة" الكلمات العربية إلى القيم الإنجليزية التالية:
- (الجندر): "بنات" → "girls", "اولاد" / "بنين" → "boys", "مختلط" / "كلاهما" → "both"
- (المستوى): "ابتدائي" / "ابتدائية" → "elementary", "متوسط" / "متوسطة" → "middle", "ثانوي" / "ثانوية" → "high", "روضة" → "kindergarten", "حضانة" → "nursery", "مجمع" → "all"
# ==========================================================

## القرب من الخدمات (بالدقائق):
- "قريب من مدرسة 5 دقايق" → school_requirements: { required: true, proximity_minutes: 5 }
- "اقصى شي 10 دقايق للجامعة" → university_requirements: { required: true, proximity_minutes: 10 }
- "جنب المترو" (إذا لم يحدد وقت) → metro_time_max: 5

## الخدمات بالاسم:
- "قريب من جامعة سعود" → university_requirements: { required: true, name: "جامعة سعود" }
- "جنب مدرسة المملكة" → school_requirements: { required: true, name: "مدرسة المملكة" }
- "قريب من جامعه نوره 10 دقايق" → university_requirements: { required: true, name: "جامعه نوره", proximity_minutes: 10 }
- "مدرسة بنات ابتدائي" → school_requirements: { required: true, gender: "girls", level: "elementary" }

## ملاحظات مهمة:
1. إذا ذكر المستخدم رقم واحد للغرف/الحمامات/الصالات، ضعه في "exact"
2. إذا ذكر "اقل شي X"، ضع X في "min" فقط
3. إذا ذكر "اقصى شي X"، ضع X في "max" فقط
4. وقت المترو/المدرسة/الجامعة بالدقائق
5. إذا طلب "مدرسة" أو "جامعة" بدون وقت، ضع required: true
6. استخرج اسم الجامعة/المدرسة كما ذكره المستخدم.

استخرج المعايير بدقة وحول جميع القيم إلى الصيغة المعيارية."""
    
    def extract_criteria(self, user_query: str) -> CriteriaExtractionResponse:
        """
        استخراج معايير البحث من طلب المستخدم
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
                        },
                        "property_type": {
                            "type": "string",
                            "enum": ["فلل", "بيت", "شقق", "استوديو", "دور", "تاون هاوس", "دوبلكس", "عمائر"],
                        },
                        "district": { "type": "string" },
                        "rooms": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "integer"},
                                "max": {"type": "integer"},
                                "exact": {"type": "integer"}
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
                            "properties": { "min": {"type": "number"}, "max": {"type": "number"} }
                        },
                        "price": {
                            "type": "object",
                            "properties": {
                                "min": {"type": "number"},
                                "max": {"type": "number"},
                                "period": {"type": "string", "enum": ["سنوي", "شهري", "يومي"]}
                            }
                        },
                        "metro_time_max": {
                            "type": "number",
                            "description": "أقصى وقت للوصول لمحطة المترو بالدقائق"
                        },
                        "school_requirements": {
                            "type": "object",
                            "description": "متطلبات قرب المدارس (إذا طلب المستخدم مدرسة)",
                            "properties": {
                                "required": {"type": "boolean", "default": False},
                                "name": {"type": "string", "description": "اسم المدرسة المحدد"},
                                "proximity_minutes": {"type": "number", "description": "أقصى وقت وصول للمدرسة بالدقائق"},
                                "gender": {"type": "string", "enum": ["boys", "girls", "both"], "description": "جنس المدرسة (بنين، بنات، كلاهما)"},
                                "level": {"type": "string", "enum": ["nursery", "kindergarten", "elementary", "middle", "high", "all"], "description": "المستوى الدراسي (ابتدائي، متوسط،... إلخ)"}
                            }
                        },
                        "university_requirements": {
                            "type": "object",
                            "description": "متطلبات قرب الجامعات (إذا طلب المستخدم جامعة)",
                            "properties": {
                                "required": {"type": "boolean", "default": False},
                                "name": {"type": "string", "description": "اسم الجامعة المحدد"},
                                "proximity_minutes": {"type": "number", "description": "أقصى وقت وصول للجامعة بالدقائق"}
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
        rooms = IntRangeFilter(**data['rooms']) if data.get('rooms') else None
        baths = IntRangeFilter(**data['baths']) if data.get('baths') else None
        halls = IntRangeFilter(**data['halls']) if data.get('halls') else None
        area_m2 = RangeFilter(**data['area_m2']) if data.get('area_m2') else None
        price = PriceFilter(**data['price']) if data.get('price') else None

        # ==========================================================
        # !! تعديل: معالجة النماذج المعقدة الجديدة + إضافة "شبكة أمان" للترجمة !!
        # ==========================================================
        
        # 1. متطلبات المدارس
        school_reqs_data = data.get('school_requirements')
        school_requirements = SchoolRequirements() # إنشاء نموذج فارغ
        if school_reqs_data:
            # !! -- هذا هو الإصلاح -- !!
            # (ترجمة الجندر والمستوى كإجراء احتياطي قبل التحقق)
            gender_map = {"بنات": "girls", "اولاد": "boys", "بنين": "boys", "كلاهما": "both", "مختلط": "both"}
            level_map = {
                "ابتدائي": "elementary", "ابتدائية": "elementary",
                "متوسط": "middle", "متوسطة": "middle",
                "ثانوي": "high", "ثانوية": "high",
                "روضة": "kindergarten",
                "حضانة": "nursery",
                "مجمع": "all"
            }
            
            raw_gender = school_reqs_data.get('gender')
            if raw_gender in gender_map:
                school_reqs_data['gender'] = gender_map[raw_gender] # استبدال "بنات" بـ "girls"
            
            raw_level = school_reqs_data.get('level')
            if raw_level in level_map:
                school_reqs_data['level'] = level_map[raw_level] # استبدال "ابتدائي" بـ "elementary"
            # !! -- نهاية الإصلاح -- !!

            # الآن التحقق (Validation) آمن
            school_requirements = SchoolRequirements(**school_reqs_data)
            
            # التأكد من أن 'required' صحيح إذا تم توفير أي تفاصيل
            if (school_reqs_data.get('proximity_minutes') or 
                school_reqs_data.get('gender') or 
                school_reqs_data.get('level') or 
                school_reqs_data.get('name')):
                school_requirements.required = True

        # 2. متطلبات الجامعات
        university_reqs_data = data.get('university_requirements')
        university_requirements = UniversityRequirements() # إنشاء نموذج فارغ
        if university_reqs_data:
            university_requirements = UniversityRequirements(**university_reqs_data)
            # التأكد من أن 'required' صحيح إذا تم توفير أي تفاصيل
            if (university_reqs_data.get('proximity_minutes') or university_reqs_data.get('name')):
                university_requirements.required = True
        # ==========================================================

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
        message += f"• {criteria.property_type.value} {criteria.purpose.value}\n"
        
        # الحي
        if criteria.district:
            message += f"• حي {criteria.district}\n"
        
        # (الكود الخاص بالغرف والمساحة والسعر... كما هو)
        # ... (تم حذفه للاختصار، افترض أنه موجود هنا) ...

        # ==========================================================
        # !! تعديل: إضافة رسائل القرب الجديدة !!
        # ==========================================================
        # القرب من المترو
        if criteria.metro_time_max:
            message += f"• قريب من محطة مترو (≤{criteria.metro_time_max:.0f} دقيقة)\n"
        
        # المدارس
        if criteria.school_requirements and criteria.school_requirements.required:
            school_text = "• قريب من "
            if criteria.school_requirements.name:
                school_text += f'"{criteria.school_requirements.name}"'
            else:
                school_text += "مدرسة"
                
            details = []
            if criteria.school_requirements.level:
                # قاموس ترجمة عكسي (للعرض فقط)
                level_display = {
                    "elementary": "ابتدائي", "middle": "متوسط", "high": "ثانوي",
                    "kindergarten": "روضة", "nursery": "حضانة", "all": "مجمع"
                }
                details.append(level_display.get(criteria.school_requirements.level.value, criteria.school_requirements.level.value))
            
            if criteria.school_requirements.gender:
                # قاموس ترجمة عكسي (للعرض فقط)
                gender_display = {"girls": "بنات", "boys": "بنين", "both": "بنين/بنات"}
                details.append(gender_display.get(criteria.school_requirements.gender.value, criteria.school_requirements.gender.value))

            if criteria.school_requirements.proximity_minutes:
                details.append(f"≤{criteria.school_requirements.proximity_minutes:.0f} دقيقة")
            
            if details:
                school_text += f" ({'، '.join(details)})"
            message += school_text + "\n"

        # الجامعات
        if criteria.university_requirements and criteria.university_requirements.required:
            uni_text = "• قريب من "
            if criteria.university_requirements.name:
                uni_text += f'"{criteria.university_requirements.name}"'
            else:
                uni_text += "جامعة"
                
            if criteria.university_requirements.proximity_minutes:
                uni_text += f" (≤{criteria.university_requirements.proximity_minutes:.0f} دقيقة)"
            message += uni_text + "\n"
        # ==========================================================
        
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
