"""
المساعد العقاري الذكي - Backend API
FastAPI Application - مع دعم المحادثة التفاعلية (Multi-Turn)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

from config import settings
from models import (
    UserQuery, SearchModeSelection, SearchResponse, 
    CriteriaExtractionResponse, ChatMessage, SearchMode,
    PropertyCriteria, Property, ActionType
)
from llm_parser import llm_parser
from search_engine import search_engine

# إعداد logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# إنشاء تطبيق FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="مساعد عقاري ذكي يستخدم الذكاء الاصطناعي لفهم طلبات المستخدمين بالعربية واللهجات السعودية - مع دعم المحادثة التفاعلية"
)

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # في الإنتاج، حدد النطاقات المسموحة
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """الصفحة الرئيسية"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "message": "مرحباً بك في المساعد العقاري الذكي! 🏡",
        "features": [
            "دعم المحادثة التفاعلية (Multi-Turn)",
            "فهم تعديلات المستخدم على الطلب السابق",
            "البحث الهجين (SQL + Vector Search)",
            "دعم اللهجة السعودية"
        ]
    }


@app.get("/health")
async def health_check():
    """فحص صحة التطبيق"""
    return {
        "status": "healthy",
        "model": settings.LLM_MODEL,
        "multi_turn_support": True  # [جديد] إشارة لدعم المحادثة التفاعلية
    }


@app.post("/api/chat/welcome")
async def welcome_message():
    """رسالة الترحيب الأولية"""
    return {
        "message": "مرحباً فيك! أنا مساعدك العقاري الذكي 🏡\nاطلب اللي تبي وأنا بجيبه لك\n\n💡 ميزة جديدة: تقدر تعدّل طلبك بسهولة! مثلاً قل:\n• 'هونت، أبي أربع غرف بدل ثلاث'\n• 'غيرت رأيي، خله إيجار مو بيع'",
        "type": "welcome"
    }


# ═══════════════════════════════════════════════════════════
# [محدّث] نقطة معالجة الطلب - مع دعم المعايير السابقة
# ═══════════════════════════════════════════════════════════
@app.post("/api/chat/query", response_model=CriteriaExtractionResponse)
async def process_user_query(query: UserQuery):
    """
    معالجة طلب المستخدم واستخراج المعايير
    
    يدعم الآن المحادثة التفاعلية:
    - إذا أُرسل previous_criteria، سيحاول النظام فهم إذا كانت الرسالة تعديل أو بحث جديد
    - يُرجع action_type لتحديد نوع الإجراء
    
    Args:
        query: طلب المستخدم (يتضمن message و previous_criteria اختيارياً)
    
    Returns:
        CriteriaExtractionResponse مع المعايير المستخرجة ونوع الإجراء
    """
    try:
        logger.info(f"📩 استلام طلب: {query.message}")
        
        # [جديد] تسجيل وجود المعايير السابقة
        if query.previous_criteria:
            logger.info(f"🔄 يوجد معايير سابقة - وضع المحادثة التفاعلية")
            logger.info(f"   المعايير السابقة: {query.previous_criteria.dict(exclude_none=True)}")
        else:
            logger.info(f"🆕 لا توجد معايير سابقة - بحث جديد")
        
        # استخراج المعايير باستخدام LLM مع المعايير السابقة
        result = llm_parser.extract_criteria(
            user_query=query.message,
            previous_criteria=query.previous_criteria  # [جديد] تمرير المعايير السابقة
        )
        
        logger.info(f"✅ نتيجة الاستخراج:")
        logger.info(f"   - success={result.success}")
        logger.info(f"   - action_type={result.action_type}")
        logger.info(f"   - needs_clarification={result.needs_clarification}")
        if result.changes_summary:
            logger.info(f"   - changes_summary={result.changes_summary}")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ خطأ في معالجة الطلب: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search", response_model=SearchResponse)
async def search_properties(selection: SearchModeSelection):
    """
    البحث عن العقارات بناءً على المعايير ونوع البحث
    
    Args:
        selection: اختيار نوع البحث والمعايير
    
    Returns:
        SearchResponse مع نتائج البحث
    """
    try:
        logger.info(f"🔍 بدء البحث: mode={selection.mode}")
        logger.info(f"   المعايير: {selection.criteria.dict(exclude_none=True)}")
        
        # البحث عن العقارات
        properties = search_engine.search(selection.criteria, selection.mode)
        
        # تحديد الرسالة بناءً على النتائج
        if len(properties) == 0:
            if selection.mode == SearchMode.EXACT:
                message = "للأسف ما لقيت عقارات تطابق طلبك بالضبط 😔\n\nلكن عندي اقتراحات قريبة جداً من اللي تبي!\nتبي أعرضها لك؟"
            else:
                message = "للأسف ما لقيت عقارات مشابهة لطلبك 😔\n\nجرب تعدل المعايير أو تتواصل معنا للمساعدة."
        elif len(properties) > 50:
            message = f"لقيت لك أكثر من {len(properties)} عقار! 🎊\n\nتبي أضيق البحث شوي؟ مثلاً:\n• تحدد نطاق سعر أضيق\n• تحدد حي معين\n• تضيف شروط إضافية"
        else:
            mode_text = "مطابق" if selection.mode == SearchMode.EXACT else "مشابه"
            message = f"لقيت لك {len(properties)} عقار {mode_text}! 🎉\n\nشوفهم على الخريطة 👇"
        
        return SearchResponse(
            success=True,
            message=message,
            criteria=selection.criteria,
            properties=properties,
            total_count=len(properties),
            search_mode=selection.mode
        )
        
    except Exception as e:
        logger.error(f"❌ خطأ في البحث: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/properties/{property_id}", response_model=Property)
async def get_property_details(property_id: str):
    """
    الحصول على تفاصيل عقار محدد
    
    Args:
        property_id: معرف العقار
    
    Returns:
        Property مع كامل التفاصيل
    """
    try:
        from database import db
        
        property_data = db.get_property_by_id(property_id)
        
        if not property_data:
            raise HTTPException(status_code=404, detail="العقار غير موجود")
        
        return Property(**property_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على تفاصيل العقار: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback")
async def submit_feedback(feedback: dict):
    """
    استقبال ملاحظات المستخدمين
    
    Args:
        feedback: بيانات الملاحظات
    
    Returns:
        رسالة تأكيد
    """
    try:
        logger.info(f"📝 استلام ملاحظات: {feedback}")
        
        # في الإنتاج، يمكن حفظ الملاحظات في قاعدة البيانات
        
        return {
            "success": True,
            "message": "شكراً لك! تم استلام ملاحظاتك بنجاح 🙏"
        }
        
    except Exception as e:
        logger.error(f"❌ خطأ في حفظ الملاحظات: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
    