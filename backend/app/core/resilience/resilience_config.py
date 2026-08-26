import os
from typing import Dict
from pydantic import BaseModel, Field

class ResilienceConfig(BaseModel):
    """
    Central configuration for the Saarathi Resilience & Reliability Engine.
    All parameters are configurable and not hardcoded across services.
    """
    # Exponential Backoff & Jitter
    MAX_RETRIES: int = Field(default=int(os.getenv("RESILIENCE_MAX_RETRIES", "3")))
    INITIAL_DELAY_MS: int = Field(default=int(os.getenv("RESILIENCE_INITIAL_DELAY_MS", "500")))
    MAX_DELAY_MS: int = Field(default=int(os.getenv("RESILIENCE_MAX_DELAY_MS", "10000")))
    JITTER_RATIO: float = Field(default=float(os.getenv("RESILIENCE_JITTER_RATIO", "0.25")))

    # Circuit Breaker
    CIRCUIT_FAILURE_THRESHOLD: int = Field(default=int(os.getenv("CIRCUIT_FAILURE_THRESHOLD", "5")))
    CIRCUIT_SUCCESS_THRESHOLD: int = Field(default=int(os.getenv("CIRCUIT_SUCCESS_THRESHOLD", "2")))
    CIRCUIT_OPEN_DURATION_SECONDS: float = Field(default=float(os.getenv("CIRCUIT_OPEN_DURATION_SECONDS", "30.0")))
    CIRCUIT_HALF_OPEN_REQUESTS: int = Field(default=int(os.getenv("CIRCUIT_HALF_OPEN_REQUESTS", "2")))

    # Operation Timeouts (Seconds)
    TIMEOUT_LLM_SECONDS: float = Field(default=float(os.getenv("TIMEOUT_LLM_SECONDS", "30.0")))
    TIMEOUT_STT_SECONDS: float = Field(default=float(os.getenv("TIMEOUT_STT_SECONDS", "45.0")))
    TIMEOUT_EMBEDDING_SECONDS: float = Field(default=float(os.getenv("TIMEOUT_EMBEDDING_SECONDS", "10.0")))
    TIMEOUT_DATABASE_SECONDS: float = Field(default=float(os.getenv("TIMEOUT_DATABASE_SECONDS", "5.0")))
    TIMEOUT_WS_HANDSHAKE_SECONDS: float = Field(default=float(os.getenv("TIMEOUT_WS_HANDSHAKE_SECONDS", "10.0")))

    # Concurrency & Backpressure
    MAX_CONCURRENT_AUDIO_JOBS: int = Field(default=int(os.getenv("MAX_CONCURRENT_AUDIO_JOBS", "3")))
    MAX_CONCURRENT_AI_REQUESTS: int = Field(default=int(os.getenv("MAX_CONCURRENT_AI_REQUESTS", "10")))

    # Cache TTLs (Seconds)
    CACHE_SHORT_TTL_SECONDS: int = Field(default=int(os.getenv("CACHE_SHORT_TTL_SECONDS", "300")))       # 5 mins
    CACHE_MEDIUM_TTL_SECONDS: int = Field(default=int(os.getenv("CACHE_MEDIUM_TTL_SECONDS", "3600")))   # 1 hour
    CACHE_LONG_TTL_SECONDS: int = Field(default=int(os.getenv("CACHE_LONG_TTL_SECONDS", "86400")))     # 24 hours

resilience_config = ResilienceConfig()
