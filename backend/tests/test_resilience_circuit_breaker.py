import pytest
import time
from app.core.resilience.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    CircuitBreakerOpenException,
    CircuitBreakerRegistry,
)
from fastapi import HTTPException

def test_circuit_breaker_initial_state():
    cb = CircuitBreaker("test-provider", failure_threshold=3, open_duration_seconds=1.0)
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True

def test_circuit_breaker_trips_to_open_on_failures():
    cb = CircuitBreaker("test-provider", failure_threshold=3, open_duration_seconds=2.0)

    # 1st failure
    cb.record_failure(HTTPException(status_code=500, detail="Server error"))
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 1

    # 2nd failure
    cb.record_failure(HTTPException(status_code=503, detail="Unavailable"))
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 2

    # 3rd failure -> Trips to OPEN
    cb.record_failure(HTTPException(status_code=502, detail="Bad Gateway"))
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

def test_circuit_breaker_ignores_400_and_422():
    cb = CircuitBreaker("test-provider", failure_threshold=3)

    cb.record_failure(HTTPException(status_code=400, detail="Malformed JSON"))
    cb.record_failure(HTTPException(status_code=422, detail="Validation Error"))
    cb.record_failure(HTTPException(status_code=401, detail="Unauthorized"))

    # State remains CLOSED and failure_count does not increase for client errors
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0

def test_circuit_breaker_half_open_recovery():
    cb = CircuitBreaker(
        "test-provider",
        failure_threshold=2,
        success_threshold=2,
        open_duration_seconds=0.1,  # Short cooldown for test
        half_open_requests=2
    )

    # Trip to OPEN
    cb.record_failure(HTTPException(status_code=500))
    cb.record_failure(HTTPException(status_code=500))
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

    # Wait for cooldown
    time.sleep(0.15)

    # First request after cooldown enters HALF_OPEN
    assert cb.can_execute() is True
    assert cb.state == CircuitState.HALF_OPEN

    # 1st trial success
    cb.record_success(latency_ms=25.0)
    assert cb.state == CircuitState.HALF_OPEN

    # 2nd trial success -> closes circuit
    assert cb.can_execute() is True
    cb.record_success(latency_ms=30.0)
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0

def test_circuit_breaker_half_open_immediate_reopen_on_failure():
    cb = CircuitBreaker(
        "test-provider",
        failure_threshold=2,
        open_duration_seconds=0.1,
        half_open_requests=2
    )

    cb.record_failure(HTTPException(status_code=500))
    cb.record_failure(HTTPException(status_code=500))
    assert cb.state == CircuitState.OPEN

    time.sleep(0.15)
    assert cb.can_execute() is True
    assert cb.state == CircuitState.HALF_OPEN

    # Trial request fails -> Trips back to OPEN immediately
    cb.record_failure(HTTPException(status_code=503))
    assert cb.state == CircuitState.OPEN

def test_circuit_breaker_health_diagnostics():
    cb = CircuitBreaker("groq-test", failure_threshold=5)
    cb.record_success(latency_ms=45.0)
    cb.record_success(latency_ms=55.0)

    health = cb.get_health()
    assert health["provider"] == "groq-test"
    assert health["status"] == "healthy"
    assert health["circuitState"] == "CLOSED"
    assert health["totalRequests"] == 2
    assert health["totalSuccesses"] == 2
    assert health["avgLatencyMs"] == 50.0

def test_circuit_breaker_registry():
    reg = CircuitBreakerRegistry.get_instance()
    groq_cb = reg.get("groq")
    gemini_cb = reg.get("gemini")
    assert groq_cb.name == "groq"
    assert gemini_cb.name == "gemini"

    all_health = reg.get_all_health()
    assert "groq" in all_health
    assert "gemini" in all_health
    assert "deepgram" in all_health
    assert "whisper" in all_health
