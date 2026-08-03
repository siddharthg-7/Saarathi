import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from '@saarathi/api';

describe('ApiClient', () => {
  it('should formulate request headers and execute fetch', async () => {
    const mockResponse = { status: 'success', data: [1, 2, 3] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const client = new ApiClient('http://api.test/v1');
    const data = await client.get('/health', { authToken: 'test-token' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/v1/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(data).toEqual(mockResponse);
  });
});
