# gunicorn_config.py
bind = "0.0.0.0:8000"
workers = 2  # عدد العمال (processors)
worker_class = "uvicorn.workers.UvicornWorker"


# هذا ضروري ليتحمل تحميل موديل BGE-M3 عند بدء التشغيل
timeout = 180
