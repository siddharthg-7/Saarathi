import pytest
import time
from app.core.resilience.response_cache import LLMResponseCache

def test_cache_generate_key_deterministic():
    k1 = LLMResponseCache.generate_cache_key(
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt="Explain Pomodoro technique",
        system_prompt_version="v1"
    )
    k2 = LLMResponseCache.generate_cache_key(
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt="Explain Pomodoro technique",
        system_prompt_version="v1"
    )
    k3 = LLMResponseCache.generate_cache_key(
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt="Explain Pomodoro technique",
        system_prompt_version="v2"  # Different version
    )
    assert k1 == k2
    assert k1 != k3

def test_cache_set_and_get():
    cache = LLMResponseCache()
    key = "test_key_123"
    value = "The Pomodoro technique is a time management method."

    cache.set(key, value, ttl_seconds=60)
    retrieved = cache.get(key)
    assert retrieved == value
    assert cache.hits == 1
    assert cache.misses == 0

def test_cache_ttl_expiration():
    cache = LLMResponseCache()
    key = "expiring_key"
    value = "Short-lived answer"

    cache.set(key, value, ttl_seconds=0)  # Expires immediately
    time.sleep(0.01)
    retrieved = cache.get(key)
    assert retrieved is None
    assert cache.misses == 1

def test_cache_invalidation():
    cache = LLMResponseCache()
    key = "invalidatable_key"
    cache.set(key, "Some response", ttl_seconds=100)
    assert cache.get(key) == "Some response"

    cache.invalidate(key)
    assert cache.get(key) is None

def test_cache_stats():
    cache = LLMResponseCache()
    cache.set("k1", "v1")
    cache.get("k1")  # Hit
    cache.get("k2")  # Miss

    stats = cache.get_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["total"] == 2
    assert stats["hitRate"] == 50.0
