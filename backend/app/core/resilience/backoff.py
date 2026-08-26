import asyncio
import logging
import random
import time
from typing import Callable, TypeVar, Any, Optional, Awaitable
from app.core.resilience.resilience_config import resilience_config
from app.core.resilience.error_classifier import classify_error, is_transient_error, ErrorCategory

logger = logging.getLogger(__name__)

T = TypeVar("T")

def compute_backoff_delay(
    attempt: int,
    base_delay_ms: Optional[int] = None,
    max_delay_ms: Optional[int] = None,
    jitter_ratio: Optional[float] = None,
    retry_after: Optional[float] = None,
) -> float:
    """
    Computes exponential backoff delay in seconds with full jitter.
    delay = min(max_delay, base_delay * 2^attempt)
    jitter = delay * jitter_ratio * random(-1, 1)
    """
    if retry_after is not None and retry_after > 0:
        # If provider returned a Retry-After header, respect it directly with a small jitter
        jitter = retry_after * 0.1 * random.uniform(0.0, 1.0)
        return retry_after + jitter

    base_ms = base_delay_ms if base_delay_ms is not None else resilience_config.INITIAL_DELAY_MS
    max_ms = max_delay_ms if max_delay_ms is not None else resilience_config.MAX_DELAY_MS
    ratio = jitter_ratio if jitter_ratio is not None else resilience_config.JITTER_RATIO

    # Exponential growth capped at max_delay_ms
    raw_delay_ms = min(float(max_ms), float(base_ms) * (2 ** attempt))

    # Apply jitter: randomized variance within [1 - ratio, 1 + ratio]
    jitter_factor = 1.0 + random.uniform(-ratio, ratio)
    final_delay_ms = max(0.0, raw_delay_ms * jitter_factor)

    return final_delay_ms / 1000.0  # Convert to seconds

async def retry_async(
    func: Callable[[], Awaitable[T]],
    max_retries: Optional[int] = None,
    base_delay_ms: Optional[int] = None,
    max_delay_ms: Optional[int] = None,
    jitter_ratio: Optional[float] = None,
    operation_name: str = "operation",
    on_retry: Optional[Callable[[int, Exception, float], None]] = None,
) -> T:
    """
    Executes an async operation with exponential backoff and jitter.
    Retries only transient errors. Fails immediately on non-transient errors (e.g. 400, 401, 422).
    """
    retries = max_retries if max_retries is not None else resilience_config.MAX_RETRIES
    attempt = 0

    while True:
        try:
            return await func()
        except Exception as exc:
            category = classify_error(exc)
            
            if not is_transient_error(category) or attempt >= retries:
                if attempt >= retries and is_transient_error(category):
                    logger.warning(
                        f"[{operation_name}] Retries exhausted ({attempt}/{retries}) for transient error: {exc}"
                    )
                raise exc

            # Extract possible retry-after
            retry_after_val = None
            if hasattr(exc, "response") and getattr(exc, "response", None) is not None:
                resp = getattr(exc, "response")
                if hasattr(resp, "headers") and "retry-after" in resp.headers:
                    try:
                        retry_after_val = float(resp.headers["retry-after"])
                    except (ValueError, TypeError):
                        pass

            delay_sec = compute_backoff_delay(
                attempt=attempt,
                base_delay_ms=base_delay_ms,
                max_delay_ms=max_delay_ms,
                jitter_ratio=jitter_ratio,
                retry_after=retry_after_val,
            )

            logger.info(
                f"[{operation_name}] Transient error ({category.value}): {exc}. "
                f"Retrying attempt {attempt + 1}/{retries} in {delay_sec:.2f}s..."
            )

            if on_retry:
                try:
                    on_retry(attempt + 1, exc, delay_sec)
                except Exception as cb_err:
                    logger.debug(f"Error in on_retry callback: {cb_err}")

            await asyncio.sleep(delay_sec)
            attempt += 1
