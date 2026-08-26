import time
import logging
import threading
from enum import Enum
from typing import Dict, Any, Optional, List
from app.core.resilience.resilience_config import resilience_config
from app.core.resilience.error_classifier import classify_error, ErrorCategory

logger = logging.getLogger(__name__)

class CircuitState(str, Enum):
    CLOSED = "CLOSED"         # Normal operation
    OPEN = "OPEN"             # Provider broken; bypass all requests
    HALF_OPEN = "HALF_OPEN"   # Testing recovery with trial requests

class CircuitBreakerOpenException(Exception):
    """Raised when an operation is attempted while circuit breaker is OPEN."""
    def __init__(self, provider: str, open_time_remaining: float):
        self.provider = provider
        self.open_time_remaining = open_time_remaining
        super().__init__(
            f"Circuit breaker for provider '{provider}' is OPEN. "
            f"Cooldown remaining: {open_time_remaining:.1f}s"
        )

class CircuitBreaker:
    """
    Thread-safe Circuit Breaker implementation with CLOSED, OPEN, and HALF_OPEN states.
    Protects downstream providers and avoids cascading system failures.
    """
    def __init__(
        self,
        name: str,
        failure_threshold: Optional[int] = None,
        success_threshold: Optional[int] = None,
        open_duration_seconds: Optional[float] = None,
        half_open_requests: Optional[int] = None,
    ):
        self.name = name
        self.failure_threshold = failure_threshold or resilience_config.CIRCUIT_FAILURE_THRESHOLD
        self.success_threshold = success_threshold or resilience_config.CIRCUIT_SUCCESS_THRESHOLD
        self.open_duration_seconds = open_duration_seconds or resilience_config.CIRCUIT_OPEN_DURATION_SECONDS
        self.half_open_max_requests = half_open_requests or resilience_config.CIRCUIT_HALF_OPEN_REQUESTS

        self.state: CircuitState = CircuitState.CLOSED
        self.failure_count: int = 0
        self.success_count: int = 0
        self.half_open_trials: int = 0
        self.total_requests: int = 0
        self.total_failures: int = 0
        self.total_successes: int = 0
        self.circuit_open_count: int = 0
        self.total_circuit_open_duration: float = 0.0

        self.last_state_change: float = time.time()
        self.last_failure_time: Optional[float] = None
        self.last_success_time: Optional[float] = None
        self.last_error_category: Optional[str] = None
        self.last_error_message: Optional[str] = None
        self.recent_latencies: List[float] = []

        self._lock = threading.RLock()

    def can_execute(self) -> bool:
        """
        Check if a request is permitted through the circuit.
        If OPEN and cooldown has expired, transitions to HALF_OPEN.
        """
        with self._lock:
            now = time.time()

            if self.state == CircuitState.CLOSED:
                return True

            if self.state == CircuitState.OPEN:
                elapsed = now - self.last_state_change
                if elapsed >= self.open_duration_seconds:
                    logger.info(f"[{self.name}] Circuit cooled down after {elapsed:.1f}s. Entering HALF_OPEN state.")
                    self.total_circuit_open_duration += elapsed
                    self.state = CircuitState.HALF_OPEN
                    self.last_state_change = now
                    self.half_open_trials = 0
                    self.success_count = 0
                    return True
                else:
                    return False

            if self.state == CircuitState.HALF_OPEN:
                if self.half_open_trials < self.half_open_max_requests:
                    self.half_open_trials += 1
                    return True
                return False

            return True

    def record_success(self, latency_ms: Optional[float] = None) -> None:
        """
        Record a successful provider request.
        """
        with self._lock:
            now = time.time()
            self.total_requests += 1
            self.total_successes += 1
            self.last_success_time = now

            if latency_ms is not None:
                self.recent_latencies.append(latency_ms)
                if len(self.recent_latencies) > 100:
                    self.recent_latencies.pop(0)

            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    logger.info(
                        f"[{self.name}] Circuit recovered ({self.success_count} consecutive successes). "
                        f"Closing circuit."
                    )
                    self.state = CircuitState.CLOSED
                    self.last_state_change = now
                    self.failure_count = 0
                    self.success_count = 0
                    self.half_open_trials = 0

            elif self.state == CircuitState.CLOSED:
                # Reset failure count on stable operation
                self.failure_count = max(0, self.failure_count - 1)

    def record_failure(self, exc: Any, latency_ms: Optional[float] = None) -> None:
        """
        Record a failed provider request.
        """
        with self._lock:
            now = time.time()
            self.total_requests += 1
            self.total_failures += 1
            self.last_failure_time = now

            category = classify_error(exc)
            self.last_error_category = category.value
            self.last_error_message = str(exc)[:200]

            if latency_ms is not None:
                self.recent_latencies.append(latency_ms)
                if len(self.recent_latencies) > 100:
                    self.recent_latencies.pop(0)

            # Never trip circuit on client errors (400, 401, 422)
            if category in (ErrorCategory.INVALID_REQUEST, ErrorCategory.VALIDATION_ERROR, ErrorCategory.AUTHENTICATION_ERROR):
                return

            if self.state == CircuitState.HALF_OPEN:
                logger.warning(f"[{self.name}] Trial request failed during HALF_OPEN. Tripping circuit back to OPEN.")
                self.state = CircuitState.OPEN
                self.last_state_change = now
                self.circuit_open_count += 1
                self.failure_count = self.failure_threshold
                self.half_open_trials = 0

            elif self.state == CircuitState.CLOSED:
                self.failure_count += 1
                if self.failure_count >= self.failure_threshold:
                    logger.warning(
                        f"[{self.name}] Failure threshold reached ({self.failure_count}/{self.failure_threshold}). "
                        f"Opening circuit for {self.open_duration_seconds}s."
                    )
                    self.state = CircuitState.OPEN
                    self.last_state_change = now
                    self.circuit_open_count += 1

    def reset(self) -> None:
        """Manually reset the circuit breaker to CLOSED state."""
        with self._lock:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.success_count = 0
            self.half_open_trials = 0
            self.last_state_change = time.time()

    def get_health(self) -> Dict[str, Any]:
        """Returns health diagnostics model representation."""
        with self._lock:
            now = time.time()
            open_remaining = 0.0
            if self.state == CircuitState.OPEN:
                elapsed = now - self.last_state_change
                open_remaining = max(0.0, self.open_duration_seconds - elapsed)

            avg_latency = (
                sum(self.recent_latencies) / len(self.recent_latencies)
                if self.recent_latencies else 0.0
            )

            p95_latency = 0.0
            if self.recent_latencies:
                sorted_lat = sorted(self.recent_latencies)
                p95_idx = int(len(sorted_lat) * 0.95)
                p95_latency = sorted_lat[min(p95_idx, len(sorted_lat) - 1)]

            status = "healthy"
            if self.state == CircuitState.OPEN:
                status = "unhealthy"
            elif self.state == CircuitState.HALF_OPEN or self.failure_count > 0:
                status = "degraded"

            return {
                "provider": self.name,
                "status": status,
                "circuitState": self.state.value,
                "failureCount": self.failure_count,
                "successCount": self.success_count,
                "totalRequests": self.total_requests,
                "totalFailures": self.total_failures,
                "totalSuccesses": self.total_successes,
                "circuitOpenCount": self.circuit_open_count,
                "totalCircuitOpenDuration": round(self.total_circuit_open_duration, 1),
                "openTimeRemainingSeconds": round(open_remaining, 1),
                "avgLatencyMs": round(avg_latency, 1),
                "p95LatencyMs": round(p95_latency, 1),
                "lastFailure": self.last_failure_time,
                "lastSuccess": self.last_success_time,
                "lastErrorCategory": self.last_error_category,
                "lastErrorMessage": self.last_error_message,
            }

class CircuitBreakerRegistry:
    """Registry managing singleton circuit breakers for external providers."""
    _instance: Optional['CircuitBreakerRegistry'] = None
    _lock = threading.Lock()

    def __init__(self):
        self._breakers: Dict[str, CircuitBreaker] = {}
        # Pre-register default core providers
        for name in ("groq", "gemini", "deepgram", "whisper", "supabase", "firestore"):
            self.get(name)

    @classmethod
    def get_instance(cls) -> 'CircuitBreakerRegistry':
        with cls._lock:
            if cls._instance is None:
                cls._instance = CircuitBreakerRegistry()
            return cls._instance

    def get(self, name: str) -> CircuitBreaker:
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(name)
        return self._breakers[name]

    def get_all_health(self) -> Dict[str, Dict[str, Any]]:
        return {name: cb.get_health() for name, cb in self._breakers.items()}

    def reset_all(self) -> None:
        for cb in self._breakers.values():
            cb.reset()

circuit_registry = CircuitBreakerRegistry.get_instance()
