"""
Cache Manager for Performance Optimization
Implements in-memory caching for search results and embeddings
"""
from typing import Any, Optional, Dict
import hashlib
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CacheManager:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self, default_ttl_seconds: int = 300):
        """
        Initialize cache manager
        
        Args:
            default_ttl_seconds: Default time-to-live for cache entries (5 minutes)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds
        logger.info(f"✅ Cache Manager initialized with {default_ttl_seconds}s TTL")
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate cache key from data"""
        data_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        hash_obj = hashlib.md5(data_str.encode('utf-8'))
        return f"{prefix}:{hash_obj.hexdigest()}"
    
    def get(self, key: str) -> Optional[Any]:
        """Retrieve value from cache if not expired"""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Check if expired
        if datetime.now() > entry['expires_at']:
            del self.cache[key]
            logger.debug(f"🗑️ Cache expired: {key}")
            return None
        
        logger.debug(f"✅ Cache hit: {key}")
        return entry['value']
    
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Store value in cache with TTL"""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        self.cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.now()
        }
        
        logger.debug(f"💾 Cached: {key} (TTL: {ttl}s)")
    
    def cache_search_results(self, criteria_dict: dict, mode: str, results: list) -> None:
        """Cache search results"""
        key_data = {**criteria_dict, 'mode': mode}
        cache_key = self._generate_key('search', key_data)
        self.set(cache_key, results, ttl_seconds=300)  # 5 minutes
    
    def get_cached_search(self, criteria_dict: dict, mode: str) -> Optional[list]:
        """Retrieve cached search results"""
        key_data = {**criteria_dict, 'mode': mode}
        cache_key = self._generate_key('search', key_data)
        return self.get(cache_key)
    
    def cache_embedding(self, text: str, embedding: list) -> None:
        """Cache embedding vector"""
        cache_key = self._generate_key('embedding', text)
        self.set(cache_key, embedding, ttl_seconds=3600)  # 1 hour
    
    def get_cached_embedding(self, text: str) -> Optional[list]:
        """Retrieve cached embedding"""
        cache_key = self._generate_key('embedding', text)
        return self.get(cache_key)
    
    def clear(self) -> None:
        """Clear all cache"""
        self.cache.clear()
        logger.info("🗑️ Cache cleared")
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        total_entries = len(self.cache)
        expired_count = sum(
            1 for entry in self.cache.values() 
            if datetime.now() > entry['expires_at']
        )
        
        return {
            'total_entries': total_entries,
            'active_entries': total_entries - expired_count,
            'expired_entries': expired_count
        }


# Global cache instance
cache_manager = CacheManager(default_ttl_seconds=300)
