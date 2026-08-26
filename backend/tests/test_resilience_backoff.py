import pytest
import asyncio
from app.core.resilience.backoff import compute_backoff_delay, retry_async
from app.core.resilience.error_classifier import ErrorCategory
from fastapi import HTTPException

def test_compute_backoff_delay_exponential():
    base_ms = 500
    max_ms = 8000
    jitter = 0.0  # No jitter for exact formula check

    d0 = compute_backoff_delay(0, base_delay_ms=base_ms, max_delay_ms=max_ms, jitter_ratio=jitter)
    d1 = compute_backoff_delay(1, base_delay_ms=base_ms, max_delay_ms=max_ms, jitter_ratio=jitter)
    d2 = compute_backoff_delay(2, base_delay_ms=base_ms, max_delay_ms=max_ms, jitter_ratio=jitter)
    d5 = compute_backoff_delay(5, base_delay_ms=base_ms, max_delay_ms=max_ms, jitter_ratio=jitter)

    assert d0 == pytest.approx(0.5, 0.01)
    assert d1 == pytest.approx(1.0, 0.01)
    assert d2 == pytest.approx(2.0, 0.01)
    # Capped at max_ms (8.0s)
    assert d5 == pytest.approx(8.0, 0.01)

def test_compute_backoff_delay_with_jitter():
    base_ms = 1000
    max_ms = 10000
    jitter = 0.25

    delays = [
        compute_backoff_delay(1, base_delay_ms=base_ms, max_delay_ms=max_ms, jitter_ratio=jitter)
        for _ in range(20)
    ]
    # Expected base for attempt 1 is 2.0s; with 0.25 jitter range is [1.5s, 2.5s]
    assert all(1.4 <= d <= 2.6 for d in delays)
    # Ensure there is variation
    assert len(set(delays)) > 1

def test_compute_backoff_delay_retry_after():
    delay = compute_backoff_delay(0, retry_after=5.0)
    # Should be around 5.0 seconds
    assert 5.0 <= delay <= 5.6

@pytest.mark.asyncio
async def test_retry_async_success_after_transient_failures():
    attempts = 0

    async def flaky_op():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise HTTPException(status_code=503, detail="Service Unavailable")
        return "success"

    result = await retry_async(
        flaky_op,
        max_retries=3,
        base_delay_ms=10,
        max_delay_ms=50,
        jitter_ratio=0.1
    )
    assert result == "success"
    assert attempts == 3

@pytest.mark.asyncio
async def test_retry_async_no_retry_on_400():
    attempts = 0

    async def invalid_request_op():
        nonlocal attempts
        attempts += 1
        raise HTTPException(status_code=400, detail="Bad Request")

    with pytest.raises(HTTPException) as exc_info:
        await retry_async(
            invalid_request_op,
            max_retries=3,
            base_delay_ms=10
        )
    assert exc_info.value.status_code == 400
    # Must NOT retry
    assert attempts == 1

@pytest.mark.asyncio
async def test_retry_async_exhausted():
    attempts = 0

    async def persistent_500():
        nonlocal attempts
        attempts += 1
        raise HTTPException(status_code=500, detail="Internal Server Error")

    with pytest.raises(HTTPException) as exc_info:
        await retry_async(
            persistent_500,
            max_retries=2,
            base_delay_ms=10,
            max_delay_ms=20
        )
    assert exc_info.value.status_code == 500
    # 1 initial attempt + 2 retries = 3
    assert attempts == 3
