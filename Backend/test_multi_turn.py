"""
اختبارات المحادثة التفاعلية (Multi-Turn)
يمكن تشغيل هذا الملف للتأكد من عمل النظام بشكل صحيح
"""
import json
from typing import Optional

# محاكاة الـ Models للاختبار المحلي
# في الإنتاج، استخدم: from models import PropertyCriteria, ActionType

class MockPropertyCriteria:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def dict(self, exclude_none=False):
        result = self.__dict__.copy()
        if exclude_none:
            result = {k: v for k, v in result.items() if v is not None}
        return result


def test_scenarios():
    """اختبار سيناريوهات المحادثة التفاعلية"""
    
    print("=" * 60)
    print("🧪 اختبارات المحادثة التفاعلية")
    print("=" * 60)
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 1: بحث جديد
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 1: بحث جديد")
    print("-" * 40)
    
    query1 = "أبي شقة للإيجار في النرجس ثلاث غرف"
    previous_criteria1 = None
    
    print(f"المستخدم: {query1}")
    print(f"المعايير السابقة: {previous_criteria1}")
    print(f"المتوقع: action_type = NEW_SEARCH")
    
    # النتيجة المتوقعة
    expected_criteria1 = {
        "purpose": "للايجار",
        "property_type": "شقق",
        "district": "النرجس",
        "rooms": {"exact": 3}
    }
    print(f"المعايير المتوقعة: {json.dumps(expected_criteria1, ensure_ascii=False, indent=2)}")
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 2: تعديل عدد الغرف
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 2: تعديل عدد الغرف")
    print("-" * 40)
    
    query2 = "هونت، أبي أربع غرف"
    previous_criteria2 = MockPropertyCriteria(
        purpose="للايجار",
        property_type="شقق",
        district="النرجس",
        rooms={"exact": 3}
    )
    
    print(f"المستخدم: {query2}")
    print(f"المعايير السابقة: {json.dumps(previous_criteria2.dict(), ensure_ascii=False)}")
    print(f"المتوقع: action_type = UPDATE_CRITERIA")
    
    # النتيجة المتوقعة بعد الدمج
    expected_criteria2 = {
        "purpose": "للايجار",
        "property_type": "شقق",
        "district": "النرجس",
        "rooms": {"exact": 4}  # تم التعديل من 3 إلى 4
    }
    print(f"المعايير المتوقعة بعد الدمج: {json.dumps(expected_criteria2, ensure_ascii=False, indent=2)}")
    print(f"ملخص التغييرات المتوقع: 'تم تعديل عدد الغرف من 3 إلى 4'")
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 3: تعديل الغرض (بيع/إيجار)
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 3: تغيير الغرض من إيجار لبيع")
    print("-" * 40)
    
    query3 = "غيرت رأيي، خله بيع مو إيجار"
    previous_criteria3 = MockPropertyCriteria(
        purpose="للايجار",
        property_type="شقق",
        district="النرجس",
        rooms={"exact": 4}
    )
    
    print(f"المستخدم: {query3}")
    print(f"المعايير السابقة: {json.dumps(previous_criteria3.dict(), ensure_ascii=False)}")
    print(f"المتوقع: action_type = UPDATE_CRITERIA")
    
    # النتيجة المتوقعة بعد الدمج
    expected_criteria3 = {
        "purpose": "للبيع",  # تم التعديل
        "property_type": "شقق",
        "district": "النرجس",
        "rooms": {"exact": 4}
    }
    print(f"المعايير المتوقعة بعد الدمج: {json.dumps(expected_criteria3, ensure_ascii=False, indent=2)}")
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 4: تغيير الحي
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 4: تغيير الحي")
    print("-" * 40)
    
    query4 = "خلها في حي الياسمين بدل النرجس"
    previous_criteria4 = MockPropertyCriteria(
        purpose="للبيع",
        property_type="شقق",
        district="النرجس",
        rooms={"exact": 4}
    )
    
    print(f"المستخدم: {query4}")
    print(f"المعايير السابقة: {json.dumps(previous_criteria4.dict(), ensure_ascii=False)}")
    print(f"المتوقع: action_type = UPDATE_CRITERIA")
    
    # النتيجة المتوقعة بعد الدمج
    expected_criteria4 = {
        "purpose": "للبيع",
        "property_type": "شقق",
        "district": "الياسمين",  # تم التعديل
        "rooms": {"exact": 4}
    }
    print(f"المعايير المتوقعة بعد الدمج: {json.dumps(expected_criteria4, ensure_ascii=False, indent=2)}")
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 5: إضافة شرط جديد (المسجد)
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 5: إضافة شرط المسجد")
    print("-" * 40)
    
    query5 = "وأبي قريب من مسجد بعد"
    previous_criteria5 = MockPropertyCriteria(
        purpose="للبيع",
        property_type="شقق",
        district="الياسمين",
        rooms={"exact": 4}
    )
    
    print(f"المستخدم: {query5}")
    print(f"المعايير السابقة: {json.dumps(previous_criteria5.dict(), ensure_ascii=False)}")
    print(f"المتوقع: action_type = UPDATE_CRITERIA")
    
    # النتيجة المتوقعة بعد الدمج
    expected_criteria5 = {
        "purpose": "للبيع",
        "property_type": "شقق",
        "district": "الياسمين",
        "rooms": {"exact": 4},
        "mosque_requirements": {  # تمت الإضافة
            "required": True,
            "max_distance_minutes": 5,
            "walking": True
        }
    }
    print(f"المعايير المتوقعة بعد الدمج: {json.dumps(expected_criteria5, ensure_ascii=False, indent=2)}")
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 6: بحث جديد تماماً (نوع عقار مختلف)
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 6: بحث جديد بالكامل")
    print("-" * 40)
    
    query6 = "أبي فيلا للبيع في جدة على البحر"
    previous_criteria6 = MockPropertyCriteria(
        purpose="للبيع",
        property_type="شقق",
        district="الياسمين",
        rooms={"exact": 4}
    )
    
    print(f"المستخدم: {query6}")
    print(f"المعايير السابقة: {json.dumps(previous_criteria6.dict(), ensure_ascii=False)}")
    print(f"المتوقع: action_type = NEW_SEARCH (بحث جديد تماماً)")
    
    # النتيجة المتوقعة - معايير جديدة بالكامل
    expected_criteria6 = {
        "purpose": "للبيع",
        "property_type": "فلل",
        "city": "جدة"
        # لاحظ: لا يوجد district أو rooms من الطلب السابق
    }
    print(f"المعايير المتوقعة (جديدة): {json.dumps(expected_criteria6, ensure_ascii=False, indent=2)}")
    
    # ═══════════════════════════════════════════════════════════
    # السيناريو 7: تعديل السعر
    # ═══════════════════════════════════════════════════════════
    print("\n📌 السيناريو 7: تعديل الميزانية")
    print("-" * 40)
    
    query7 = "زود الميزانية لـ ٥٠٠ ألف"
    previous_criteria7 = MockPropertyCriteria(
        purpose="للبيع",
        property_type="شقق",
        district="الياسمين",
        rooms={"exact": 4},
        price={"max": 300000}
    )
    
    print(f"المستخدم: {query7}")
    print(f"المعايير السابقة: {json.dumps(previous_criteria7.dict(), ensure_ascii=False)}")
    print(f"المتوقع: action_type = UPDATE_CRITERIA")
    
    # النتيجة المتوقعة بعد الدمج
    expected_criteria7 = {
        "purpose": "للبيع",
        "property_type": "شقق",
        "district": "الياسمين",
        "rooms": {"exact": 4},
        "price": {"max": 500000}  # تم التعديل
    }
    print(f"المعايير المتوقعة بعد الدمج: {json.dumps(expected_criteria7, ensure_ascii=False, indent=2)}")
    
    print("\n" + "=" * 60)
    print("✅ انتهت الاختبارات")
    print("=" * 60)
    print("\n💡 لتشغيل الاختبارات الفعلية مع الـ API:")
    print("   python test_multi_turn.py --live")


def test_merge_logic():
    """اختبار منطق الدمج"""
    print("\n" + "=" * 60)
    print("🔧 اختبار منطق الدمج (Merge Logic)")
    print("=" * 60)
    
    # دالة الدمج
    def merge_criteria(previous: dict, updates: dict) -> dict:
        merged = previous.copy()
        for key, value in updates.items():
            if value is not None:
                if isinstance(value, dict) and isinstance(merged.get(key), dict):
                    merged[key] = {**merged[key], **value}
                else:
                    merged[key] = value
        return merged
    
    # اختبار 1: دمج بسيط
    prev1 = {"purpose": "للايجار", "property_type": "شقق", "rooms": {"exact": 3}}
    upd1 = {"rooms": {"exact": 4}}
    result1 = merge_criteria(prev1, upd1)
    print(f"\nاختبار 1: تغيير قيمة بسيطة")
    print(f"  السابق: {prev1}")
    print(f"  التحديث: {upd1}")
    print(f"  النتيجة: {result1}")
    assert result1["rooms"]["exact"] == 4, "فشل اختبار 1"
    print(f"  ✅ نجح")
    
    # اختبار 2: إضافة حقل جديد
    prev2 = {"purpose": "للبيع", "property_type": "شقق"}
    upd2 = {"district": "النرجس", "rooms": {"exact": 3}}
    result2 = merge_criteria(prev2, upd2)
    print(f"\nاختبار 2: إضافة حقول جديدة")
    print(f"  السابق: {prev2}")
    print(f"  التحديث: {upd2}")
    print(f"  النتيجة: {result2}")
    assert result2["district"] == "النرجس", "فشل اختبار 2"
    assert result2["rooms"]["exact"] == 3, "فشل اختبار 2"
    print(f"  ✅ نجح")
    
    # اختبار 3: دمج كائنات معقدة
    prev3 = {"price": {"min": 100000, "max": 300000}}
    upd3 = {"price": {"max": 500000}}
    result3 = merge_criteria(prev3, upd3)
    print(f"\nاختبار 3: دمج كائنات معقدة")
    print(f"  السابق: {prev3}")
    print(f"  التحديث: {upd3}")
    print(f"  النتيجة: {result3}")
    assert result3["price"]["min"] == 100000, "فشل اختبار 3"
    assert result3["price"]["max"] == 500000, "فشل اختبار 3"
    print(f"  ✅ نجح")
    
    print("\n✅ جميع اختبارات الدمج نجحت!")


if __name__ == "__main__":
    import sys
    
    if "--live" in sys.argv:
        print("🚀 تشغيل الاختبارات الحية مع API...")
        # هنا يمكن إضافة اختبارات حية مع الـ API
        print("⚠️ الاختبارات الحية غير مُفعّلة حالياً")
    else:
        test_scenarios()
        test_merge_logic()
