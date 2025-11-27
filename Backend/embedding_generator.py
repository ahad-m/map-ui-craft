from sentence_transformers import SentenceTransformer
import logging
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    """
    مسؤول عن توليد embeddings للنصوص باستخدام BGE-m3
    يستخدم نمط Singleton لضمان تحميل الموديل مرة واحدة فقط.
    """
    _instance = None
    _model = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            logger.info("يتم إنشاء instance من EmbeddingGenerator...")
            cls._instance = super(EmbeddingGenerator, cls).__new__(cls)
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
        توليد embedding لنص واحد
        """
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
                return embedding.tolist()
            elif isinstance(embedding, list):
                return embedding
            else:
                logger.error(f"نوع الـ embedding غير متوقع: {type(embedding)}")
                return list(map(float, embedding))
                
        except Exception as e:
            logger.error(f"خطأ في توليد الـ embedding: {e}")
            return []

# إنشاء instance عام ليتم استخدامه في المشروع
# (سيتم تحميل الموديل عند أول استدعاء لـ generate)
embedding_generator = EmbeddingGenerator()
