import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memoryApi } from '../memoryApi';
import { apiClient } from '../client';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('memoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /memory/index on indexMemory', async () => {
    const mockMemory = {
      id: 'mem_1',
      userId: 'u1',
      sourceType: 'user_preference' as const,
      content: 'Morning study routine',
      importance: 0.8,
      confidence: 1.0,
      embeddingModel: 'all-MiniLM-L6-v2',
      embeddingVersion: '1.0.0',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:00:00Z',
      isActive: true,
    };
    (apiClient.post as any).mockResolvedValue(mockMemory);

    const res = await memoryApi.indexMemory({
      sourceType: 'user_preference',
      content: 'Morning study routine',
      importance: 0.8,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/memory/index', expect.objectContaining({
      sourceType: 'user_preference',
      content: 'Morning study routine',
    }));
    expect(res.id).toBe('mem_1');
  });

  it('calls POST /memory/search on searchMemories', async () => {
    const mockResponse = {
      query: 'study routine',
      results: [],
      totalMatches: 0,
      retrievalLatencyMs: 8,
    };
    (apiClient.post as any).mockResolvedValue(mockResponse);

    const res = await memoryApi.searchMemories({
      query: 'study routine',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/memory/search', {
      query: 'study routine',
    });
    expect(res.totalMatches).toBe(0);
  });

  it('calls GET /memory with params on listMemories', async () => {
    (apiClient.get as any).mockResolvedValue([]);
    await memoryApi.listMemories(20, 0, 'goal', true);

    expect(apiClient.get).toHaveBeenCalledWith('/memory?limit=20&offset=0&isActive=true&sourceType=goal');
  });

  it('calls GET /memory/stats on getMemoryStats', async () => {
    const mockStats = {
      totalMemories: 5,
      activeMemories: 5,
      countsBySource: { goal: 5 },
      embeddingModel: 'all-MiniLM-L6-v2',
      dimensions: 384,
    };
    (apiClient.get as any).mockResolvedValue(mockStats);

    const res = await memoryApi.getMemoryStats();
    expect(apiClient.get).toHaveBeenCalledWith('/memory/stats');
    expect(res.dimensions).toBe(384);
  });
});
