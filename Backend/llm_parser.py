"""
وحدة استخراج معايير البحث من طلب المستخدم باستخدام النموذج اللغوي
(نسخة محدثة تدعم السياق + القيود المشددة)
"""
from openai import OpenAI
from config import settings
from models import (
    PropertyCriteria, PropertyPurpose, PropertyType, PricePeriod,
    RangeFilter, IntRangeFilter, PriceFilter, 
    SchoolRequirements, UniversityRequirements, SchoolGender, SchoolLevel,
    CriteriaExtractionResponse, ChatMessage # <-- إضافة ChatMessage
)
import json
import logging
from typing import List # <-- إضافة List

logger = logging.getLogger(__name__)


class LLMParser:
    """محلل طلبات المستخدم باستخدام النموذج اللغوي"""
    
    def __init__(self):
        """تهيئة OpenAI client"""
        self.client = OpenAI()
        self.model = settings.LLM_MODEL
        
        # System prompt متخصص لفهم اللهجة السعودية
        self.system_prompt = """أنت مساعد عقاري ذكي متخصص في فهم اللهجة السعودية والعربية الفصحى.
مهمتك استخراج معايير البحث عن العقارات من طلبات المستخدمين بدقة عالية.

# ==========================================================
# !! أهم تعديل: حدود ونطاق المساعد (Guardrails) - نسخة مشددة !!
# ==========================================================
مهمتك "فقط وفقط" هي مساعدة المستخدم في "البحث عن عقار" عن طريق استخراج المعايير (purpose, property_type, district, rooms, etc.).

أنت "لست" خبيراً عقارياً عاماً.
إذا سألك المستخدم أي سؤال "خارج نطاق البحث" (حتى لو كان عن العقارات)، يجب أن ترفض الإجابة.

أمثلة "خارج النطاق" (يجب رفضها):
- "كيف آخذ قرض عقاري؟"
- "ما هي توقعات أسعار العقار في الرياض؟"
- "من هم أفضل المطورين العقاريين؟"
- "ما هي أفضل أحياء الرياض للسكن؟" (إلا إذا كانت جزءاً من طلب بحث، مثل "ابي فيلا في أفضل حي").
- "ما هي إجراءات شراء عقار؟"

إذا سألك سؤالاً من هذا النوع، يجب أن ترد بلطف وتعود لمهمتك الأساسية.
مثال للرد: "عفواً، أنا متخصص فقط في مساعدتك لإيجاد عقار بناءً على مواصفاتك. هل تبحث عن عقار بمواصفات معينة اليوم؟"

لا تقم "أبداً" باستدعاء دالة "extract_property_criteria" إذا كان السؤال خارج نطاق البحث.
# ==========================================================

## سياق المحادثة:
أنت مساعد "حواري". سأعطيك تاريخ المحادثة (conversation history).
إذا كان طلب المستخدم الجديد هو "تعديل" (مثل: "لا، خل الغرف 4" أو "طيب غير الحي إلى 'السلام'"), 
مهمتك هي أن تأخذ المعايير (criteria) من الرسالة السابقة، وتطبق عليها التعديل المطلوب، ثم ترجع "كامل" المعايير الجديدة.

## ترجمة قيم المدارس (Enums):
عند استدعاء الدالة، يجب عليك "ترجمة" الكلمات العربية إلى القيم الإنجليزية التالية:
- (الجندر): "بنات" → "girls", "اولاد" / "بنين" → "boys", "مختلط" / "كلاهما" → "both"
- (المستوى): "ابتدائي" / "ابتدائية" → "elementary", "متوسط" / "متوسطة" → "middle", "ثانوي" / "ثانوية" → "high", "روضة" → "kindergarten", "حضانة" → "nursery", "مجمع" → "all"

## الخدمات بالاسم:
- "قريب من جامعة سعود" → university_requirements: { required: true, name: "جامعة سعود" }
- "جنب مدرسة المملكة" → school_requirements: { required: true, name: "مدرسة المملكة" }
- "مدرسة بنات ابتدائي" → school_requirements: { required: true, gender: "girls", level: "elementary" }

## ملاحظات مهمة:
1. إذا طلب المستخدم "تعديل" (مثلاً "ابي 5 غرف بدال 4")، عدّل المعيار.
2. إذا طلب "إلغاء" (مثلاً "خلاص ما أبي قريب من مدرسة")، احذف المعيار (اجعله null).

استخرج المعايير بدقة وحول جميع القيم إلى الصيغة المعيارية."""
    
    def extract_criteria(self, user_query: str, history: List[ChatMessage] = []) -> CriteriaExtractionResponse:
        """
        استخراج معايير البحث من طلب المستخدم (مع السياق)
        """
        try:
            # بناء قائمة الرسائل (التاريخ + الرسالة الجديدة)
            messages_payload = [
                {"role": "system", "content": self.system_prompt}
            ]
            # إضافة التاريخ (نحول نموذج Pydantic إلى dict)
            for msg in history:
                messages_payload.append(msg.dict())
            
            # إضافة رسالة المستخدم الجديدة
            messages_payload.append({"role": "user", "content": user_query})

            # (تعريف functions كما هو - لم يتغير)
            functions = [{
                "name": "extract_property_criteria",
                "description": "استخراج معايير البحث عن العقار من طلب المستخدم",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "purpose": { "type": "string", "enum": ["للبيع", "للايجار"] },
                        "property_type": { "type": "string", "enum": ["فلل", "بيت", "شقق", "استوديو", "دور", "تاون هاوس", "دوبلكس", "عمائر"] },
                        "district": { "type": "string" },
                        "rooms": { "type": "object", "properties": { "min": {"type": "integer"}, "max": {"type": "integer"}, "exact": {"type": "integer"} } },
                        "baths": { "type": "object", "properties": { "min": {"type": "integer"}, "max": {"type": "integer"}, "exact": {"type": "integer"} } },
                        "halls": { "type": "object", "properties": { "min": {"type": "integer"}, "max": {"type": "integer"}, "exact": {"type": "integer"} } },
                        "area_m2": { "type": "object", "properties": { "min": {"type": "number"}, "max": {"type": "number"} } },
                        "price": { "type": "object", "properties": { "min": {"type": "number"}, "max": {"type": "number"}, "period": {"type": "string", "enum": ["سنوي", "شهري", "يومي"]} } },
                        "metro_time_max": { "type": "number" },
                        "school_requirements": {
                            "type": "object",
                            "properties": {
                                "required": {"type": "boolean", "default": False},
                                "name": {"type": "string"},
                                "proximity_minutes": {"type": "number"},
                                "gender": {"type": "string", "enum": ["boys", "girls", "both"]},
                                "level": {"type": "string", "enum": ["nursery", "kindergarten", "elementary", "middle", "high", "all"]}
                            }
                        },
                        "university_requirements": {
                            "type": "object",
                            "properties": {
                                "required": {"type": "boolean", "default": False},
                                "name": {"type": "string"},
                                "proximity_minutes": {"type": "number"}
                            }
                        }
                    },
                    "required": ["purpose", "property_type"]
                }
            }]
            
            # استدعاء النموذج اللغوي
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages_payload, # <-- !! تعديل: استخدام الحمولة الجديدة !!
                functions=functions,
                function_call="auto", # <-- !! تعديل: اجعلها 'auto' بدلاً من إجبارية !!
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS ,
                timeout=30.0
            )
            
            response_message = response.choices[0].message
            function_call = response_message.function_call
            
            # ==========================================================
            # !! تعديل: التعامل مع الردود غير العقارية !!
            # ==========================================================
            # الحالة 1: المساعد قرر استخراج المعايير (الطلب عقاري)
            if function_call:
                criteria_dict = json.loads(function_call.arguments)
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
            
            # الحالة 2: المساعد قرر الرد (الطلب خارج النطاق أو سؤال عام)
            else:
                # التأكد من أن الرد ليس فارغاً
                reply_content = response_message.content or "عفواً، أنا متخصص فقط في مساعدتك لإيجاد عقار. هل تبحث عن عقار بمواصفات معينة اليوم؟"
                return CriteriaExtractionResponse(
                    success=False,
                    message=reply_content,
                    needs_clarification=True # (اجعلها true ليبقى الحوار مفتوحاً)
                )
            # ==========================================================
            
        except Exception as e:
            logger.error(f"خطأ في استخراج المعايير: {e}")
            # (هذا الكود لإصلاح الخطأ الذي واجهته سابقاً)
            if "Input should be" in str(e) and "gender" in str(e):
                 return CriteriaExtractionResponse(
                    success=False,
                    message="عفواً، لم أفهم نوع المدرسة (بنين/بنات/مختلط). هل يمكنك تحديدها بوضوح؟",
                    needs_clarification=True
                )
            return CriteriaExtractionResponse(
                success=False,
                message=f"حدث خطأ في معالجة طلبك. الرجاء المحاولة مرة أخرى.",
                needs_clarification=True
            )
    
    # (دالة _dict_to_criteria كما هي - بدون تغيير)
    def _dict_to_criteria(self, data: dict, original_query: str) -> PropertyCriteria:
        """تحويل dict إلى PropertyCriteria"""
        
        # معالجة الحقول المعقدة
        rooms = IntRangeFilter(**data['rooms']) if data.get('rooms') else None
        baths = IntRangeFilter(**data['baths']) if data.get('baths') else None
        halls = IntRangeFilter(**data['halls']) if data.get('halls') else None
        area_m2 = RangeFilter(**data['area_m2']) if data.get('area_m2') else None
        price = PriceFilter(**data['price']) if data.get('price') else None

        
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
    
    # (دالة _generate_confirmation_message كما هي - بدون تغيير)
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
        
        message += "\nتبي بس المطابق لطلبك ولا عادي نقترح لك اللي يشبهه؟\nمتأكدين بيعجبك! 😊"
        
        return message
    
    # (دالة _generate_clarification_questions كما هي - بدون تغيير)
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
