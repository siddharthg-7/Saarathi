import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMemoryStore } from '../useMemoryStore';
import { memoryApi } from '@saarathi/api';

vi.mock('@saarathi/api', () => ({
  memoryApi: {
    listMemories: vi.fn().mockResolvedValue([
      {
        id: 'mem_101',
        userId: 'u1',
        sourceType: 'note',
        content: 'Testing note content',
        importance: 0.7,
        confidence: 1.0,
        embeddingModel: 'all-MiniLM-L6-v2',
        embeddingVersion: '1.0.0',
        createdAt: '2026-08-25T10:00:00Z',
        updatedAt: '2026-08-25T10:00:00Z',
        isActive: true,
      },
    ]),
    getMemoryStats: vi.fn().mockResolvedValue({
      totalMemories: 1,
      activeMemories: 1,
      countsBySource: { note: 1 },
      embeddingModel: 'all-MiniLM-L6-v2',
      dimensions: 384,
    }),
    searchMemories: vi.fn().mockResolvedValue({
      query: 'Testing',
      results: [
        {
          memoryId: 'mem_101',
          userId: 'u1',
          sourceType: 'note',
          content: 'Testing note content',
          importance: 0.7,
          confidence: 1.0,
          semanticScore: 0.9,
          keywordScore: 0.8,
          hybridScore: 0.87,
          createdAt: '2026-08-25T10:00:00Z',
        },
      ],
      totalMatches: 1,
      retrievalLatencyMs: 12,
    }),
    indexMemory: vi.fn().mockImplementation(async (input) => ({
      id: 'mem_new_1',
      userId: 'u1',
      sourceType: input.sourceType,
      content: input.content,
      importance: input.importance ?? 0.5,
      confidence: 1.0,
      embeddingModel: 'all-MiniLM-L6-v2',
      embeddingVersion: '1.0.0',
      createdAt: '2026-08-25T12:00:00Z',
      updatedAt: '2026-08-25T12:00:00Z',
      isActive: true,
    })),
    deleteMemory: vi.fn().mockResolvedValue({ status: 'ok', deleted: true, memoryId: 'mem_101' }),
    clearAllMemories: vi.fn().mockResolvedValue({ status: 'ok', clearedCount: 1 }),
  },
}));

describe('useMemoryStore', () => {
  beforeEach(() => {
    useMemoryStore.setState({
      memories: [],
      stats: null,
      searchQuery: '',
      searchResults: [],
      activeFilter: {},
      isLoading: false,
      isSearching: false,
      memorySystemEnabled: true,
      selectedMemory: null,
      error: null,
    });
  });

  it('fetches memories and populates state', async () => {
    await useMemoryStore.getState().fetchMemories();
    expect(useMemoryStore.getState().memories.length).toBe(1);
    expect(useMemoryStore.getState().memories[0].content).toBe('Testing note content');
  });

  it('searches memories and sets hybrid results', async () => {
    await useMemoryStore.getState().searchMemories('Testing');
    expect(useMemoryStore.getState().searchResults.length).toBe(1);
    expect(useMemoryStore.getState().searchResults[0].hybridScore).toBe(0.87);
  });

  it('indexes new memory and prepends to list', async () => {
    const created = await useMemoryStore.getState().indexMemory({
      sourceType: 'user_preference',
      content: 'Early morning coding sessions',
      importance: 0.9,
    });
    expect(created).not.toBeNull();
    expect(useMemoryStore.getState().memories.length).toBe(1);
    expect(useMemoryStore.getState().memories[0].content).toBe('Early morning coding sessions');
  });

  it('toggles memory system on and off', () => {
    expect(useMemoryStore.getState().memorySystemEnabled).toBe(true);
    useMemoryStore.getState().toggleMemorySystem(false);
    expect(useMemoryStore.getState().memorySystemEnabled).toBe(false);
  });
});
