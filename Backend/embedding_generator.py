from sentence_transformers import SentenceTransformer
import logging
import numpy as np
import json

logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    """
    مسؤول عن توليد embeddings للنصوص باستخدام BGE-m3
    يستخدم نمط Singleton لضمان تحميل الموديل مرة واحدة فقط.
    مع دعم Cache لتحسين الأداء
    """
    _instance = None
    _model = None
    _cache = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            logger.info("يتم إنشاء instance من EmbeddingGenerator...")
            cls._instance = super(EmbeddingGenerator, cls).__new__(cls)
            # Initialize cache
            try:
                from cache_manager import cache_manager
                cls._cache = cache_manager
            except:
                logger.warning("Cache manager not available")
        return cls._instance

    def _load_model(self):
        """
        تحميل الموديل عند أول استدعاء (Lazy Loading)
        """
        if self._model is None:
            logger.info("يتم تحميل موديل BGE-m3... (قد يستغرق بعض الوقت)")
            try:
                # الاسم الرسمي للموديل
                self._model = SentenceTransformer('BAAI/bge-m3')
                logger.info("تم تحميل موديل BGE-m3 بنجاح.")
            except Exception as e:
                logger.error(f"فشل تحميل موديل BGE-m3: {e}")
                raise

    def generate(self, text: str) -> list[float]:
        """
        توليد embedding لنص واحد مع دعم Cache
        """
        # Check cache first
        if self._cache:
            cached = self._cache.get_cached_embedding(text)
            if cached:
                logger.info("✅ Using cached embedding")
                return cached
        
        # تحميل الموديل إذا لم يتم تحميله
        self._load_model()
        
        if self._model is None:
            logger.error("الموديل غير جاهز، لا يمكن توليد embedding")
            raise Exception("الموديل غير جاهز")
        
        try:
            # توليد الـ embedding
            embedding = self._model.encode(text, normalize_embeddings=True)
            
            # التأكد أن المخرج هو list of floats
            if isinstance(embedding, np.ndarray):
                result = embedding.tolist()
            elif isinstance(embedding, list):
                result = embedding
            else:
                logger.error(f"نوع الـ embedding غير متوقع: {type(embedding)}")
                result = list(map(float, embedding))
            
            # Cache the result
            if self._cache:
                self._cache.cache_embedding(text, result)
            
            return result
                
        except Exception as e:
            logger.error(f"خطأ في توليد الـ embedding: {e}")
            return []

# إنشاء instance عام ليتم استخدامه في المشروع
# (سيتم تحميل الموديل عند أول استدعاء لـ generate)
embedding_generator = EmbeddingGenerator()
