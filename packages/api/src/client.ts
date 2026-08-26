import { env } from './config/env';
import { retryWithBackoff, RetryOptions } from './resilience/retryClient';
import { defaultApiClientCircuit } from './resilience/circuitBreaker';

export interface RequestOptions extends RequestInit {
  authToken?: string;
  params?: Record<string, string>;
  retryOptions?: RetryOptions;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = env.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(customHeaders?: HeadersInit, token?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return { ...headers, ...customHeaders };
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { authToken, params, headers, retryOptions, ...customConfig } = options;

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: this.getHeaders(headers, authToken),
      ...customConfig,
    };

    if (!defaultApiClientCircuit.canExecute()) {
      console.warn(`[ApiClient] Circuit is OPEN for backend API. Fallback mode.`);
      if (!env.enableMockFallback) {
        throw new Error(`API Circuit breaker is OPEN for ${endpoint}.`);
      }
    }

    const isTestEnv =
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || process.env?.VITEST === 'true');

    const effectiveRetryOptions: RetryOptions = {
      maxRetries: isTestEnv ? 1 : 3,
      initialDelayMs: isTestEnv ? 20 : 500,
      maxDelayMs: isTestEnv ? 100 : 8000,
      timeoutMs: isTestEnv ? 2000 : 30000,
      ...retryOptions,
    };

    try {
      return await retryWithBackoff<T>(async (signal) => {
        const response = await fetch(url, { ...config, signal });

        if (!response.ok) {
          const errorBody = await response.text();
          const err = new Error(`API Request failed [${response.status}]: ${errorBody}`);
          (err as any).status = response.status;
          (err as any).headers = response.headers;
          defaultApiClientCircuit.recordFailure();
          throw err;
        }

        defaultApiClientCircuit.recordSuccess();

        if (response.status === 204) {
          return {} as T;
        }

        return (await response.json()) as T;
      }, effectiveRetryOptions);
    } catch (error) {
      if (!env.enableMockFallback) {
        throw error;
      }
      console.warn(
        `[ApiClient] Network request failed for ${endpoint}. Fallback mode active.`,
        error
      );
      throw error;
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
