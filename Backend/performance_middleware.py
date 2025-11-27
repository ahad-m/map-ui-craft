"""
Performance Monitoring Middleware
Tracks request timing and adds performance headers
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware to track and log request performance"""
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Add performance header
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        
        # Log slow requests (>1000ms)
        if process_time > 1000:
            logger.warning(
                f"⚠️ Slow request detected: {request.method} {request.url.path} "
                f"took {process_time:.2f}ms"
            )
        else:
            logger.info(
                f"✅ {request.method} {request.url.path} "
                f"completed in {process_time:.2f}ms"
            )
        
        return response
