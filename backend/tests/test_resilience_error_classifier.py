import pytest
import httpx
from fastapi import HTTPException
from app.core.resilience.error_classifier import (
    ErrorCategory,
    classify_status_code,
    classify_error,
    is_transient_error,
    get_user_friendly_message,
)

def test_classify_status_code():
    assert classify_status_code(429) == ErrorCategory.RATE_LIMITED
    assert classify_status_code(500) == ErrorCategory.PROVIDER_UNAVAILABLE
    assert classify_status_code(502) == ErrorCategory.PROVIDER_UNAVAILABLE
    assert classify_status_code(503) == ErrorCategory.PROVIDER_UNAVAILABLE
    assert classify_status_code(504) == ErrorCategory.PROVIDER_TIMEOUT
    assert classify_status_code(400) == ErrorCategory.INVALID_REQUEST
    assert classify_status_code(401) == ErrorCategory.AUTHENTICATION_ERROR
    assert classify_status_code(403) == ErrorCategory.AUTHENTICATION_ERROR
    assert classify_status_code(422) == ErrorCategory.VALIDATION_ERROR

def test_classify_exceptions():
    assert classify_error(HTTPException(status_code=429)) == ErrorCategory.RATE_LIMITED
    assert classify_error(httpx.ConnectTimeout("Connection timed out")) == ErrorCategory.PROVIDER_TIMEOUT
    assert classify_error(httpx.ConnectError("Connection refused")) == ErrorCategory.TRANSIENT_NETWORK
    assert classify_error(Exception("Rate limit exceeded")) == ErrorCategory.RATE_LIMITED
    assert classify_error(Exception("Circuit breaker is OPEN")) == ErrorCategory.CIRCUIT_OPEN

def test_is_transient_error():
    assert is_transient_error(ErrorCategory.TRANSIENT_NETWORK) is True
    assert is_transient_error(ErrorCategory.RATE_LIMITED) is True
    assert is_transient_error(ErrorCategory.PROVIDER_TIMEOUT) is True
    assert is_transient_error(ErrorCategory.PROVIDER_UNAVAILABLE) is True
    assert is_transient_error(ErrorCategory.DATABASE_UNAVAILABLE) is True

    # Non-transient errors must return False
    assert is_transient_error(ErrorCategory.INVALID_REQUEST) is False
    assert is_transient_error(ErrorCategory.VALIDATION_ERROR) is False
    assert is_transient_error(ErrorCategory.AUTHENTICATION_ERROR) is False

def test_user_friendly_messages():
    for cat in ErrorCategory:
        msg = get_user_friendly_message(cat)
        assert isinstance(msg, str)
        assert len(msg) > 10
        # Ensure no raw stack traces or internal technical leakages
        assert "traceback" not in msg.lower()
        assert "aiohttp" not in msg.lower()
        assert "httpx" not in msg.lower()
