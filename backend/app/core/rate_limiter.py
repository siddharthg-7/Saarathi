import time
import threading
from enum import Enum
from typing import Dict, Tuple, Optional, Callable
from fastapi import Request, HTTPException, status
from app.core.security import verify_firebase_token, decode_and_verify_token

class RateLimitTier(str, Enum):
    DEFAULT = "DEFAULT"           # 120 req / 60s
    KAIRO_CHAT = "KAIRO_CHAT"     # 30 req / 60s
    STT_AUDIO = "STT_AUDIO"       # 10 req / 60s
    BRAIN_DUMP = "BRAIN_DUMP"     # 15 req / 60s
    MEMORY_SEARCH = "MEMORY_SEARCH" # 60 req / 60s
    ADMIN = "ADMIN"               # 20 req / 60s
    TELEMETRY = "TELEMETRY"       # 180 req / 60s

TIER_CONFIGS: Dict[RateLimitTier, Tuple[int, int]] = {
    RateLimitTier.DEFAULT: (120, 60),
    RateLimitTier.KAIRO_CHAT: (30, 60),
    RateLimitTier.STT_AUDIO: (10, 60),
    RateLimitTier.BRAIN_DUMP: (15, 60),
    RateLimitTier.MEMORY_SEARCH: (60, 60),
    RateLimitTier.ADMIN: (20, 60),
    RateLimitTier.TELEMETRY: (180, 60),
}

TIER_MESSAGES: Dict[RateLimitTier, str] = {
    RateLimitTier.KAIRO_CHAT: "Kairo is receiving too many requests right now. Please try again shortly.",
    RateLimitTier.STT_AUDIO: "Audio transcription limit reached. Please wait a moment before sending more audio.",
    RateLimitTier.BRAIN_DUMP: "Brain dump processing limit reached. Please wait before processing more thoughts.",
    RateLimitTier.MEMORY_SEARCH: "Memory search request limit reached. Please try again shortly.",
    RateLimitTier.DEFAULT: "Too many requests. Please slow down.",
}

class TokenBucket:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_rate = refill_rate_per_sec
        self.last_update = time.time()

    def consume(self, tokens: int = 1) -> Tuple[bool, int]:
        now = time.time()
        elapsed = now - self.last_update
        self.tokens = min(self.capacity, self.tokens + (elapsed * self.refill_rate))
        self.last_update = now

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True, 0
        else:
            missing_tokens = tokens - self.tokens
            retry_after = int(missing_tokens / self.refill_rate) + 1 if self.refill_rate > 0 else 60
            return False, retry_after

class InMemoryRateLimiter:
    """
    Thread-safe in-memory token bucket rate limiter.
    Architecture supports replacing the backend with Redis for multi-instance deployments.
    """
    def __init__(self):
        self._buckets: Dict[str, TokenBucket] = {}
        self._lock = threading.Lock()

    def check_rate_limit(self, identifier: str, tier: RateLimitTier) -> Tuple[bool, int]:
        max_requests, window_seconds = TIER_CONFIGS.get(tier, TIER_CONFIGS[RateLimitTier.DEFAULT])
        refill_rate = max_requests / float(window_seconds)
        bucket_key = f"{tier.value}:{identifier}"

        with self._lock:
            if bucket_key not in self._buckets:
                self._buckets[bucket_key] = TokenBucket(capacity=max_requests, refill_rate_per_sec=refill_rate)
            bucket = self._buckets[bucket_key]
            return bucket.consume(1)

    def reset(self, identifier: Optional[str] = None) -> None:
        with self._lock:
            if identifier:
                keys_to_del = [k for k in self._buckets if k.endswith(f":{identifier}")]
                for k in keys_to_del:
                    del self._buckets[k]
            else:
                self._buckets.clear()

rate_limiter = InMemoryRateLimiter()

def rate_limit(tier: RateLimitTier = RateLimitTier.DEFAULT) -> Callable:
    """
    FastAPI route dependency that enforces rate limits for the specified tier.
    Identifies caller by Authorization UID or client IP address.
    """
    async def dependency(request: Request):
        auth_header = request.headers.get("Authorization")
        identifier = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            try:
                user = decode_and_verify_token(token)
                identifier = user.uid
            except Exception:
                pass
        
        if not identifier:
            identifier = request.client.host if request.client else "anonymous_client"

        allowed, retry_after = rate_limiter.check_rate_limit(identifier, tier)
        if not allowed:
            user_msg = TIER_MESSAGES.get(tier, TIER_MESSAGES[RateLimitTier.DEFAULT])
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": user_msg,
                    "retryAfter": retry_after,
                    "tier": tier.value,
                },
                headers={"Retry-After": str(retry_after)}
            )
        return True
    return dependency
