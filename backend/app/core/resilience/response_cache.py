import hashlib
import json
import time
import threading
import logging
from typing import Optional, Any, Dict
from app.core.resilience.resilience_config import resilience_config

logger = logging.getLogger(__name__)

class CacheEntry:
    def __init__(self, key: str, value: str, ttl_seconds: int, metadata: Optional[Dict[str, Any]] = None):
        self.key = key
        self.value = value
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds
        self.metadata = metadata or {}

class LLMResponseCache:
    """
    Intelligent response cache for deterministic & safe AI requests.
    Includes context versioning, TTL expiration, invalidation, and failure safety.
    """
    _instance: Optional['LLMResponseCache'] = None
    _lock = threading.Lock()

    def __init__(self):
        self._cache: Dict[str, CacheEntry] = {}
        self._cache_lock = threading.RLock()
        self.hits: int = 0
        self.misses: int = 0

    @classmethod
    def get_instance(cls) -> 'LLMResponseCache':
        with cls._lock:
            if cls._instance is None:
                cls._instance = LLMResponseCache()
            return cls._instance

    @staticmethod
    def generate_cache_key(
        provider: str,
        model: str,
        prompt: str,
        system_prompt_version: str = "v1",
        relevant_context: Optional[str] = None,
        memory_context_version: Optional[str] = None,
        tool_version: Optional[str] = None,
        locale: str = "en",
        feature_version: str = "v1"
    ) -> str:
        """
        Creates a deterministic hash key incorporating all relevant context.
        """
        key_components = {
            "provider": provider,
            "model": model,
            "prompt": prompt,
            "system_prompt_version": system_prompt_version,
            "relevant_context": relevant_context or "",
            "memory_context_version": memory_context_version or "",
            "tool_version": tool_version or "",
            "locale": locale,
            "feature_version": feature_version,
        }
        serialized = json.dumps(key_components, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[str]:
        """
        Retrieve cached response if key exists and has not expired.
        Never throws; returns None safely if storage encounters an issue.
        """
        try:
            with self._cache_lock:
                now = time.time()
                entry = self._cache.get(key)
                if entry:
                    if entry.expires_at > now:
                        self.hits += 1
                        logger.debug(f"[LLMCache] HIT for key {key[:12]}...")
                        return entry.value
                    else:
                        # Expired
                        del self._cache[key]
                self.misses += 1
                return None
        except Exception as e:
            logger.warning(f"[LLMCache] Error reading cache (falling back to live LLM): {e}")
            return None

    def set(
        self,
        key: str,
        value: str,
        ttl_seconds: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Stores response in cache with specified TTL.
        Never throws; logs warning on storage issue.
        """
        try:
            ttl = ttl_seconds if ttl_seconds is not None else resilience_config.CACHE_MEDIUM_TTL_SECONDS
            with self._cache_lock:
                self._cache[key] = CacheEntry(key, value, ttl, metadata)
                logger.debug(f"[LLMCache] SET key {key[:12]}... (TTL: {ttl}s)")
        except Exception as e:
            logger.warning(f"[LLMCache] Error saving to cache: {e}")

    def invalidate(self, key: str) -> None:
        """Explicitly invalidate a cache key."""
        try:
            with self._cache_lock:
                if key in self._cache:
                    del self._cache[key]
        except Exception as e:
            logger.warning(f"[LLMCache] Error invalidating cache key: {e}")

    def clear(self) -> None:
        """Clear the entire cache."""
        with self._cache_lock:
            self._cache.clear()
            self.hits = 0
            self.misses = 0

    def get_stats(self) -> Dict[str, Any]:
        with self._cache_lock:
            total = self.hits + self.misses
            hit_rate = (self.hits / total * 100.0) if total > 0 else 0.0
            return {
                "hits": self.hits,
                "misses": self.misses,
                "total": total,
                "hitRate": round(hit_rate, 2),
                "cachedEntries": len(self._cache),
            }

llm_cache = LLMResponseCache.get_instance()
