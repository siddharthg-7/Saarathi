export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  timeoutMs?: number;
  operationName?: string;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

export const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 8000,
  jitterRatio: 0.25,
  timeoutMs: 30000,
  operationName: 'fetch',
};

/**
 * Computes exponential backoff with full jitter in milliseconds.
 */
export function computeClientBackoffDelay(
  attempt: number,
  initialDelayMs: number = DEFAULT_RETRY_OPTIONS.initialDelayMs,
  maxDelayMs: number = DEFAULT_RETRY_OPTIONS.maxDelayMs,
  jitterRatio: number = DEFAULT_RETRY_OPTIONS.jitterRatio,
  retryAfterMs?: number
): number {
  if (retryAfterMs !== undefined && retryAfterMs > 0) {
    const jitter = retryAfterMs * 0.1 * Math.random();
    return retryAfterMs + jitter;
  }

  const rawDelay = Math.min(maxDelayMs, initialDelayMs * Math.pow(2, attempt));
  const jitterFactor = 1.0 + (Math.random() * 2 - 1) * jitterRatio;
  return Math.max(0, Math.round(rawDelay * jitterFactor));
}

/**
 * Determines if an error is transient and safe to retry.
 */
export function isTransientClientError(error: unknown, status?: number): boolean {
  if (status !== undefined) {
    if (status === 429) return true;
    if (status >= 500 && status <= 599) return true;
    if (status >= 400 && status < 500) return false; // 400, 401, 403, 422 never retried
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('timeout') ||
      msg.includes('aborterror')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Executes a fetch or async task with exponential backoff, jitter, and timeout.
 */
export async function retryWithBackoff<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err: any) {
      clearTimeout(timer);

      const status = err?.status || err?.statusCode;
      const isTransient = isTransientClientError(err, status);

      if (!isTransient || attempt >= config.maxRetries) {
        throw err;
      }

      // Check Retry-After header
      let retryAfterMs: number | undefined;
      if (err?.headers && typeof err.headers.get === 'function') {
        const headerVal = err.headers.get('retry-after');
        if (headerVal) {
          const parsed = parseFloat(headerVal);
          if (!isNaN(parsed)) {
            retryAfterMs = parsed * 1000;
          }
        }
      }

      const delayMs = computeClientBackoffDelay(
        attempt,
        config.initialDelayMs,
        config.maxDelayMs,
        config.jitterRatio,
        retryAfterMs
      );

      if (config.onRetry) {
        config.onRetry(attempt + 1, err, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt++;
    }
  }
}
