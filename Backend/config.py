"""
ملف الإعدادات للمساعد العقاري الذكي
"""
from pydantic_settings import BaseSettings
from typing import Optional
from typing import Optional  # أضف Optional إذا مو موجود


class Settings(BaseSettings):
    """إعدادات التطبيق"""
    
    # إعدادات Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # إعدادات OpenAI (متوفرة في البيئة)
    OPENAI_API_KEY: str
    HUGGINGFACE_API_KEY: Optional[str] = None

    
    # إعدادات النموذج اللغوي
    LLM_MODEL: str = "gpt-4o-mini"  # يمكن التبديل إلى "gemini-2.5-flash" أو "gpt-4.1-nano"
    LLM_TEMPERATURE: float = 0.1  # منخفضة للدقة العالية
    LLM_MAX_TOKENS: int = 1000
    
    # إعدادات البحث
    EXACT_SEARCH_LIMIT: int = 500
    HYBRID_SEARCH_LIMIT: int = 500
    VECTOR_SIMILARITY_THRESHOLD: float = 0.7
    
    # أوزان البحث الهجين
    SQL_WEIGHT: float = 0.7
    VECTOR_WEIGHT: float = 0.3
    
    # إعدادات التطبيق
    APP_NAME: str = "المساعد العقاري الذكي"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# إنشاء instance من الإعدادات
settings = Settings()
