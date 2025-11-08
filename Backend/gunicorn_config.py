# gunicorn_config.py
bind = "0.0.0.0:8000"
workers = 2  # عدد العمال (processors)
worker_class = "uvicorn.workers.UvicornWorker"

# هذا هو أهم سطر لمشروعك
# نعطيه 3 دقائق (180 ثانية) كوقت مستقطع (timeout)
# هذا ضروري ليتحمل تحميل موديل BGE-M3 عند بدء التشغيل
timeout = 180
