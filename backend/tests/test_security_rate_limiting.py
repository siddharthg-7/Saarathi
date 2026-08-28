import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.rate_limiter import rate_limiter, RateLimitTier

client = TestClient(app)

def test_rate_limiting_tier_enforcement():
    rate_limiter.reset()
    user_id = "test_rate_limited_user"

    # STT Audio tier limit is 10 requests per 60s
    for i in range(10):
        allowed, retry_after = rate_limiter.check_rate_limit(user_id, RateLimitTier.STT_AUDIO)
        assert allowed is True
        assert retry_after == 0

    # 11th request exceeds limit
    allowed, retry_after = rate_limiter.check_rate_limit(user_id, RateLimitTier.STT_AUDIO)
    assert allowed is False
    assert retry_after > 0

def test_rate_limit_endpoint_response_429():
    rate_limiter.reset()
    auth_header = {"Authorization": "Bearer test_burst_user"}

    # Exhaust KAIRO_CHAT limit (30 requests)
    for _ in range(30):
        rate_limiter.check_rate_limit("test_burst_user", RateLimitTier.KAIRO_CHAT)

    # Subsequent request to /v1/kairo/chat should trigger 429
    response = client.post(
        "/v1/kairo/chat",
        json={"message": "Hello Kairo"},
        headers=auth_header
    )
    assert response.status_code == 429
    assert "Retry-After" in response.headers
    data = response.json()
    assert data["detail"]["error"] == "rate_limit_exceeded"
    assert "too many requests" in data["detail"]["message"].lower()

def test_rate_limiter_reset():
    rate_limiter.reset()
    allowed, _ = rate_limiter.check_rate_limit("test_user_reset", RateLimitTier.DEFAULT)
    assert allowed is True
