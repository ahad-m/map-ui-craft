"""
وحدة استخراج معايير البحث من طلب المستخدم باستخدام النموذج اللغوي
النسخة المحدّثة - مع دعم المحادثة التفاعلية (Multi-Turn)
"""
from openai import OpenAI
from config import settings
from models import (
    PropertyCriteria, PropertyPurpose, PropertyType, PricePeriod,
    RangeFilter, IntRangeFilter, PriceFilter, SchoolRequirements,
    UniversityRequirements, MosqueRequirements,
    CriteriaExtractionResponse, ActionType
)
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# القائمة الرسمية للجامعات (للتوحيد)
OFFICIAL_UNIVERSITIES = [
    "مركز الملك عبدالله للدراسات البترولية والبحوث",
    "كلية العناية الطبية",
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
    "كلية الشريعة والقانون جامعة المجمعة ( طلاب - طالبات ) بالغاط",
    "مدرسة سلاح الإشارة بالحرس الوطني",
    "جامعة نايف العربية للعلوم الأمنية",
    "الكلية التقنية المجمعة",
    "كلية الاتصالات والمعلومات",
    "كلية العلوم والدراسات الإنسانية بحوطة سدير",
    "الجامعة السعودية الإلكترونية",
    "جامعة الملك سعود كلية المجتمع طلاب",
    "كلية الملك عبدالله بن عبدالعزيز للقيادة و الأركان",
    "كلية التقنية بالأرطاوية",
    "جامعة اليمامة",
    "الأكاديمية الوطنية للبناء",
    "الأكاديمية الوطنية للصناعات العسكرية",
    "المعهد العلمي بالدرعية",
    "جامعة الأمير سطام بن عبدالعزيز في وادي الدواسر",
    "جامعة الفيصل",
    "الكلية التقنية للسياحة و الفندقة بالمزاحمية"
]


class LLMParser:
    """محلل طلبات المستخدم باستخدام النموذج اللغوي - مع دعم المحادثة التفاعلية"""
    
    def __init__(self):
        """تهيئة OpenAI client"""
        self.client = OpenAI()
        self.model = settings.LLM_MODEL
        
        # ═══════════════════════════════════════════════════════════
        # System Prompt 
        # ═══════════════════════════════════════════════════════════
        self.system_prompt = f"""أنت مساعد عقاري ذكي متخصص في فهم اللهجة السعودية والعربية الفصحى.
مهمتك استخراج معايير البحث عن العقارات من طلبات المستخدمين بدقة عالية.

═══════════════════════════════════════════════════════════
##  دعم المحادثة التفاعلية (Multi-Turn) - مهم جداً!
═══════════════════════════════════════════════════════════

أنت الآن تدعم المحادثات التفاعلية. هذا يعني:
1. قد يرسل المستخدم طلباً جديداً بالكامل
2. أو قد يرسل تعديلاً على طلبه السابق

### كيف تحدد نوع الرسالة؟

**رسالة تعديل (UPDATE_CRITERIA)** - إذا تضمنت الرسالة:
- عبارات تعديل صريحة: "هونت"، "غيرت رأيي"، "لخبطت"، "بدل"، "خله"، "عدّل"، "غيّر"
- إشارة للطلب السابق: "بدل ثلاث"، "مو بيع خله إيجار"، "زود الميزانية"
- تعديل قيمة محددة بدون ذكر باقي التفاصيل: "أربع غرف" (بدون ذكر نوع العقار)
- أمثلة:
  * "هونت، أبي أربع غرف نوم" ← تعديل عدد الغرف فقط
  * "غيرت رأيي، خله إيجار مو بيع" ← تعديل الغرض فقط
  * "لا لخبطت، أبي خمس غرف بدل ثلاث" ← تعديل عدد الغرف
  * "خلها في حي الياسمين بدل النرجس" ← تعديل الحي فقط
  * "زود الميزانية لـ ٥ آلاف" ← تعديل السعر فقط
  * "أبي قريب من مسجد بعد" ← إضافة شرط المسجد

**رسالة بحث جديد (NEW_SEARCH)** - إذا:
- الرسالة تحتوي على طلب كامل جديد (نوع عقار + غرض)
- تغيير جذري في نوع العقار أو المدينة
- الرسالة لا تشير للطلب السابق إطلاقاً
- أمثلة:
  * "أبي فيلا في جدة على البحر" ← بحث جديد بالكامل
  * "أبحث عن عمارة تجارية" ← بحث جديد (نوع مختلف تماماً)

### قواعد الدمج (Merge Logic):
عند التعديل (UPDATE_CRITERIA):
1. ابدأ بنسخ جميع المعايير السابقة (previous_criteria)
2. عدّل فقط الحقول المذكورة في الرسالة الجديدة
3. أبقِ باقي الحقول كما هي بدون تغيير
4. إذا قال المستخدم "ألغِ" أو "شيل" شرط معين، أزله (اجعله null)

═══════════════════════════════════════════════════════════

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

## الجامعات - توحيد الأسماء:
**القائمة الرسمية للجامعات:**
{json.dumps(OFFICIAL_UNIVERSITIES, ensure_ascii=False, indent=2)}

**قواعد توحيد أسماء الجامعات:**
1. إذا ذكر المستخدم اسم جامعة، يجب أن تجد الاسم الرسمي المطابق من القائمة
2. تجاهل الفروقات البسيطة في الإملاء

## المساجد:
1. إذا ذكر المستخدم "مسجد" أو "جامع"، فعّل mosque_requirements.required = true
2. إذا ذكر اسم مسجد محدد، ضعه في mosque_requirements.mosque_name
3. الوقت الافتراضي: 5 دقائق مشياً

## ملاحظات مهمة:
1. إذا ذكر المستخدم رقم واحد للغرف/الحمامات/الصالات، ضعه في "exact"
2. إذا ذكر "اقل شي X"، ضع X في "min" فقط
3. إذا ذكر "اقصى شي X"، ضع X في "max" فقط
4. الوقت الافتراضي للجامعات: 15 دقيقة بالسيارة
5. الوقت الافتراضي للمساجد: 5 دقائق مشياً

استخرج المعايير بدقة وحدد نوع الإجراء (NEW_SEARCH أو UPDATE_CRITERIA)."""

    def extract_criteria(
        self, 
        user_query: str, 
        previous_criteria: Optional[PropertyCriteria] = None
    ) -> CriteriaExtractionResponse:
        """
        استخراج معايير البحث من طلب المستخدم
        
        Args:
            user_query: طلب المستخدم النصي
            previous_criteria: المعايير السابقة (إن وجدت) للمحادثة التفاعلية
        
        Returns:
            CriteriaExtractionResponse يحتوي على المعايير المستخرجة ونوع الإجراء
        """
        try:
            # تحضير السياق السابق إذا وجد
            context_message = ""
            if previous_criteria:
                context_message = f"""
═══════════════════════════════════════════════════════════
 المعايير السابقة (من الطلب الأخير):
═══════════════════════════════════════════════════════════
{json.dumps(previous_criteria.dict(exclude_none=True), ensure_ascii=False, indent=2)}
═══════════════════════════════════════════════════════════

الرسالة الجديدة من المستخدم: "{user_query}"

حدد: هل هذه الرسالة تعديل على الطلب السابق (UPDATE_CRITERIA) أم بحث جديد (NEW_SEARCH)؟
إذا كانت تعديل، ادمج التغييرات مع المعايير السابقة.
"""
            else:
                context_message = f'رسالة المستخدم: "{user_query}"'

            # تعريف function للاستخراج المنظم مع دعم نوع الإجراء
            functions = [{
                "name": "extract_property_criteria",
                "description": "استخراج معايير البحث عن العقار من طلب المستخدم مع تحديد نوع الإجراء",
                "parameters": {
                    "type": "object",
                    "properties": {
                        # ═══════════════════════════════════════════════════════════
                        # [جديد] حقل نوع الإجراء
                        # ═══════════════════════════════════════════════════════════
                        "action_type": {
                            "type": "string",
                            "enum": ["NEW_SEARCH", "UPDATE_CRITERIA"],
                            "description": "نوع الإجراء: NEW_SEARCH لبحث جديد، UPDATE_CRITERIA لتعديل على الطلب السابق"
                        },
                        "changes_summary": {
                            "type": "string",
                            "description": "ملخص التغييرات بالعربي (مثل: 'تم تعديل عدد الغرف من 3 إلى 4'). مطلوب فقط إذا كان action_type = UPDATE_CRITERIA"
                        },
                        # ═══════════════════════════════════════════════════════════
                        # الحقول الأصلية
                        # ═══════════════════════════════════════════════════════════
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
                                "university_name": {"type": "string"},
                                "max_distance_minutes": {"type": "number"}
                            }
                        },
                        "mosque_requirements": {
                            "type": "object",
                            "properties": {
                                "required": {"type": "boolean"},
                                "mosque_name": {"type": "string"},
                                "max_distance_minutes": {"type": "number"},
                                "walking": {"type": "boolean"}
                            }
                        }
                    },
                    "required": ["action_type", "purpose", "property_type"]
                }
            }]
            
            # استدعاء النموذج اللغوي
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": context_message}
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
                    action_type=ActionType.CLARIFICATION,
                    clarification_questions=[
                        "هل تبحث عن عقار للبيع أو للإيجار؟",
                        "ما نوع العقار الذي تبحث عنه؟ (فيلا، شقة، بيت، إلخ)"
                    ]
                )
            
            # تحويل النتيجة إلى dict
            criteria_dict = json.loads(function_call.arguments)
            
            # استخراج نوع الإجراء وملخص التغييرات
            action_type_str = criteria_dict.pop('action_type', 'NEW_SEARCH')
            action_type = ActionType(action_type_str)
            changes_summary = criteria_dict.pop('changes_summary', None)
            
            # ═══════════════════════════════════════════════════════════
            # [جديد] دمج المعايير إذا كان التعديل
            # ═══════════════════════════════════════════════════════════
            if action_type == ActionType.UPDATE_CRITERIA and previous_criteria:
                criteria_dict = self._merge_criteria(
                    previous_criteria.dict(exclude_none=True),
                    criteria_dict
                )
                logger.info(f"🔄 تم دمج المعايير. التغييرات: {changes_summary}")
            
            # تحويل الـ dict إلى PropertyCriteria
            criteria = self._dict_to_criteria(criteria_dict, user_query)
            
            # التحقق من اكتمال المعايير الأساسية
            if not criteria.purpose or not criteria.property_type:
                return CriteriaExtractionResponse(
                    success=False,
                    message="أحتاج معلومات إضافية لمساعدتك بشكل أفضل.",
                    criteria=criteria,
                    needs_clarification=True,
                    action_type=ActionType.CLARIFICATION,
                    clarification_questions=self._generate_clarification_questions(criteria)
                )
            
            # نجح الاستخراج
            message = self._generate_confirmation_message(criteria, action_type, changes_summary)
            
            return CriteriaExtractionResponse(
                success=True,
                message=message,
                criteria=criteria,
                needs_clarification=False,
                action_type=action_type,
                changes_summary=changes_summary,
                previous_criteria=previous_criteria
            )
            
        except Exception as e:
            logger.error(f"خطأ في استخراج المعايير: {e}")
            return CriteriaExtractionResponse(
                success=False,
                message=f"حدث خطأ في معالجة طلبك. الرجاء المحاولة مرة أخرى.",
                needs_clarification=True,
                action_type=ActionType.CLARIFICATION
            )

    def _merge_criteria(self, previous: dict, updates: dict) -> dict:
        """
        دمج المعايير الجديدة مع السابقة
        
        Args:
            previous: المعايير السابقة
            updates: التحديثات الجديدة
        
        Returns:
            المعايير المدمجة
        """
        merged = previous.copy()
        
        for key, value in updates.items():
            if value is not None:
                # إذا كان الحقل كائن معقد (dict)، ندمج محتوياته
                if isinstance(value, dict) and isinstance(merged.get(key), dict):
                    merged[key] = {**merged[key], **value}
                else:
                    merged[key] = value
        
        return merged
    
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
            mosque_requirements=mosque_requirements,
            original_query=original_query
        )
    
    def _generate_confirmation_message(
        self, 
        criteria: PropertyCriteria, 
        action_type: ActionType,
        changes_summary: Optional[str] = None
    ) -> str:
        """توليد رسالة تأكيد المعايير المستخرجة"""
        
        # ═══════════════════════════════════════════════════════════
        # [جديد] رسالة مختلفة للتعديلات
        # ═══════════════════════════════════════════════════════════
        if action_type == ActionType.UPDATE_CRITERIA:
            message = "تم التعديل! 👍\n"
            if changes_summary:
                message += f"📝 {changes_summary}\n\n"
            message += "المعايير المحدّثة:\n"
        else:
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
        
        # المساجد
        if criteria.mosque_requirements and criteria.mosque_requirements.required:
            mosque_text = "• قريب من مسجد"
            if criteria.mosque_requirements.mosque_name:
                mosque_text += f" {criteria.mosque_requirements.mosque_name}"
            if criteria.mosque_requirements.max_distance_minutes:
                movement_type = "مشياً" if criteria.mosque_requirements.walking else "بالسيارة"
                mosque_text += f" (≤{criteria.mosque_requirements.max_distance_minutes:.0f} دقيقة {movement_type})"
            message += mosque_text + "\n"
        
        # رسالة الختام
        if action_type == ActionType.UPDATE_CRITERIA:
            message += "\nتبي أبحث بالمعايير الجديدة؟ 😊"
        else:
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
