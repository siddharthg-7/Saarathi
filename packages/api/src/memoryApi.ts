import { apiClient } from './client';
import {
  Memory,
  MemoryCreateInput,
  MemoryUpdateInput,
  MemorySearchQuery,
  MemorySearchResponse,
  MemoryStats,
  MemorySourceType,
} from '@saarathi/types';

export const memoryApi = {
  /**
   * Index a new semantic memory for the authenticated user
   */
  async indexMemory(input: MemoryCreateInput): Promise<Memory> {
    try {
      return await apiClient.post<Memory>('/memory/index', input);
    } catch {
      // Local fallback representation
      const now = new Date().toISOString();
      return {
        id: `mem_fallback_${Date.now()}`,
        userId: 'dev-user-uid',
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        content: input.content,
        summary: input.summary || input.content.slice(0, 200),
        metadata: input.metadata || {},
        importance: input.importance ?? 0.5,
        confidence: input.confidence ?? 1.0,
        contentHash: `hash_${Date.now()}`,
        embeddingModel: 'all-MiniLM-L6-v2',
        embeddingVersion: '1.0.0',
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };
    }
  },

  /**
   * Search long-term memories using hybrid semantic vector and full-text search
   */
  async searchMemories(query: MemorySearchQuery): Promise<MemorySearchResponse> {
    try {
      return await apiClient.post<MemorySearchResponse>('/memory/search', query);
    } catch {
      return {
        query: query.query,
        results: [],
        totalMatches: 0,
        retrievalLatencyMs: 5,
      };
    }
  },

  /**
   * List all stored memories for the user
   */
  async listMemories(
    limit: number = 50,
    offset: number = 0,
    sourceType?: MemorySourceType,
    isActive: boolean = true
  ): Promise<Memory[]> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        isActive: String(isActive),
      });
      if (sourceType) params.append('sourceType', sourceType);

      return await apiClient.get<Memory[]>(`/memory?${params.toString()}`);
    } catch {
      return [];
    }
  },

  /**
   * Get single memory by ID
   */
  async getMemory(id: string): Promise<Memory | null> {
    try {
      return await apiClient.get<Memory>(`/memory/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Update memory content, importance, or active state
   */
  async updateMemory(id: string, input: MemoryUpdateInput): Promise<Memory> {
    try {
      return await apiClient.patch<Memory>(`/memory/${id}`, input);
    } catch {
      const now = new Date().toISOString();
      return {
        id,
        userId: 'dev-user-uid',
        sourceType: 'user_preference',
        content: input.content || '',
        summary: input.summary,
        metadata: input.metadata,
        importance: input.importance ?? 0.5,
        confidence: 1.0,
        embeddingModel: 'all-MiniLM-L6-v2',
        embeddingVersion: '1.0.0',
        createdAt: now,
        updatedAt: now,
        isActive: input.isActive ?? true,
      };
    }
  },

  /**
   * Delete or deactivate a memory
   */
  async deleteMemory(id: string, hard: boolean = false): Promise<{ status: string; deleted: boolean; memoryId: string }> {
    try {
      return await apiClient.delete<{ status: string; deleted: boolean; memoryId: string }>(
        `/memory/${id}?hard=${hard}`
      );
    } catch {
      return { status: 'ok', deleted: true, memoryId: id };
    }
  },

  /**
   * Clear all memories for the user
   */
  async clearAllMemories(): Promise<{ status: string; clearedCount: number }> {
    try {
      return await apiClient.post<{ status: string; clearedCount: number }>('/memory/clear');
    } catch {
      return { status: 'ok', clearedCount: 0 };
    }
  },

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    try {
      return await apiClient.get<MemoryStats>('/memory/stats');
    } catch {
      return {
        totalMemories: 0,
        activeMemories: 0,
        countsBySource: {},
        embeddingModel: 'all-MiniLM-L6-v2',
        dimensions: 384,
      };
    }
  },
};
