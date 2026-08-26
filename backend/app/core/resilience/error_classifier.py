import logging
from enum import Enum
from typing import Optional, Any
import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class ErrorCategory(str, Enum):
    TRANSIENT_NETWORK = "TRANSIENT_NETWORK"
    RATE_LIMITED = "RATE_LIMITED"
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    INVALID_REQUEST = "INVALID_REQUEST"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE"
    CIRCUIT_OPEN = "CIRCUIT_OPEN"
    UNKNOWN = "UNKNOWN"

def classify_status_code(status_code: int) -> ErrorCategory:
    """
    Classify an HTTP status code into an ErrorCategory.
    """
    if status_code == 429:
        return ErrorCategory.RATE_LIMITED
    elif status_code in (401, 403):
        return ErrorCategory.AUTHENTICATION_ERROR
    elif status_code == 422:
        return ErrorCategory.VALIDATION_ERROR
    elif 400 <= status_code < 500:
        return ErrorCategory.INVALID_REQUEST
    elif status_code == 504:
        return ErrorCategory.PROVIDER_TIMEOUT
    elif status_code in (500, 502, 503):
        return ErrorCategory.PROVIDER_UNAVAILABLE
    elif 500 <= status_code < 600:
        return ErrorCategory.PROVIDER_UNAVAILABLE
    return ErrorCategory.UNKNOWN

def classify_error(exc: Any) -> ErrorCategory:
    """
    Classify any Python or HTTP exception into a normalized ErrorCategory.
    """
    if exc is None:
        return ErrorCategory.UNKNOWN

    # HTTPException with status_code
    if isinstance(exc, HTTPException):
        return classify_status_code(exc.status_code)

    # HTTPX Exceptions
    if isinstance(exc, httpx.TimeoutException):
        return ErrorCategory.PROVIDER_TIMEOUT
    elif isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout, httpx.NetworkError)):
        return ErrorCategory.TRANSIENT_NETWORK
    elif isinstance(exc, httpx.HTTPStatusError):
        return classify_status_code(exc.response.status_code)

    # String or generic exception inspection
    exc_str = str(exc).lower()
    if "rate limit" in exc_str or "429" in exc_str or "quota exceeded" in exc_str:
        return ErrorCategory.RATE_LIMITED
    elif "timed out" in exc_str or "timeout" in exc_str:
        return ErrorCategory.PROVIDER_TIMEOUT
    elif "connection refused" in exc_str or "connection reset" in exc_str or "nodename nor servname provided" in exc_str or "dns" in exc_str:
        return ErrorCategory.TRANSIENT_NETWORK
    elif "unauthorized" in exc_str or "invalid api key" in exc_str or "forbidden" in exc_str:
        return ErrorCategory.AUTHENTICATION_ERROR
    elif "circuit breaker is open" in exc_str:
        return ErrorCategory.CIRCUIT_OPEN
    elif "firestore" in exc_str or "supabase" in exc_str or "database" in exc_str:
        return ErrorCategory.DATABASE_UNAVAILABLE

    return ErrorCategory.UNKNOWN

def is_transient_error(category: ErrorCategory) -> bool:
    """
    Determines whether an error is transient and safe to retry.
    Never retries 400, 401, 403, 422, or invalid requests.
    """
    return category in (
        ErrorCategory.TRANSIENT_NETWORK,
        ErrorCategory.RATE_LIMITED,
        ErrorCategory.PROVIDER_TIMEOUT,
        ErrorCategory.PROVIDER_UNAVAILABLE,
        ErrorCategory.DATABASE_UNAVAILABLE,
    )

def get_user_friendly_message(category: ErrorCategory) -> str:
    """
    Return a clear, reassuring message for user presentation.
    Never exposes internal stack traces or provider error details.
    """
    messages = {
        ErrorCategory.TRANSIENT_NETWORK: "Network connection is temporarily unstable. Your action is safe and will retry shortly.",
        ErrorCategory.RATE_LIMITED: "AI service is experiencing high demand. Retrying automatically in a moment...",
        ErrorCategory.PROVIDER_TIMEOUT: "The AI request took longer than expected. Retrying with backup provider...",
        ErrorCategory.PROVIDER_UNAVAILABLE: "Kairo is temporarily having trouble reaching its primary AI service. Your request is safe — please try again.",
        ErrorCategory.AUTHENTICATION_ERROR: "Authentication check could not be completed. Please refresh or re-sign in.",
        ErrorCategory.INVALID_REQUEST: "The request could not be processed due to invalid parameters.",
        ErrorCategory.VALIDATION_ERROR: "Validation failed for the requested input.",
        ErrorCategory.DATABASE_UNAVAILABLE: "Data storage is temporarily synchronizing offline. Your changes are saved locally.",
        ErrorCategory.CIRCUIT_OPEN: "AI service is currently resting to recover. Automatic fallback is active.",
        ErrorCategory.UNKNOWN: "An unexpected condition occurred. Kairo handled it safely.",
    }
    return messages.get(category, messages[ErrorCategory.UNKNOWN])
