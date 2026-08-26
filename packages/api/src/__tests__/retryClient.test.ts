import { describe, it, expect, vi } from 'vitest';
import {
  computeClientBackoffDelay,
  isTransientClientError,
  retryWithBackoff,
} from '../resilience/retryClient';

describe('retryClient', () => {
  it('computes exponential backoff with capping', () => {
    const d0 = computeClientBackoffDelay(0, 500, 8000, 0);
    const d1 = computeClientBackoffDelay(1, 500, 8000, 0);
    const d2 = computeClientBackoffDelay(2, 500, 8000, 0);
    const d5 = computeClientBackoffDelay(5, 500, 8000, 0);

    expect(d0).toBe(500);
    expect(d1).toBe(1000);
    expect(d2).toBe(2000);
    expect(d5).toBe(8000); // capped at max
  });

  it('correctly classifies transient vs permanent errors', () => {
    expect(isTransientClientError(null, 429)).toBe(true);
    expect(isTransientClientError(null, 500)).toBe(true);
    expect(isTransientClientError(null, 503)).toBe(true);
    expect(isTransientClientError(new Error('Failed to fetch'))).toBe(true);
    expect(isTransientClientError(new Error('Network error'))).toBe(true);

    // Non-transient errors
    expect(isTransientClientError(null, 400)).toBe(false);
    expect(isTransientClientError(null, 401)).toBe(false);
    expect(isTransientClientError(null, 422)).toBe(false);
  });

  it('retries transient failures and returns result on success', async () => {
    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount < 3) {
        const err = new Error('Service Unavailable');
        (err as any).status = 503;
        throw err;
      }
      return { success: true };
    });

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 50,
      jitterRatio: 0.1,
    });

    expect(result).toEqual({ success: true });
    expect(callCount).toBe(3);
  });

  it('does not retry 400 Bad Request error', async () => {
    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      const err = new Error('Bad Request');
      (err as any).status = 400;
      throw err;
    });

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelayMs: 10 })
    ).rejects.toThrow('Bad Request');

    expect(callCount).toBe(1);
  });
});
