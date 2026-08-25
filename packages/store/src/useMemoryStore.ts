import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Memory,
  MemoryCreateInput,
  MemoryUpdateInput,
  MemorySearchFilter,
  HybridSearchResult,
  MemoryStats,
  MemorySourceType,
} from '@saarathi/types';
import { memoryApi } from '@saarathi/api';

interface MemoryState {
  memories: Memory[];
  stats: MemoryStats | null;
  searchQuery: string;
  searchResults: HybridSearchResult[];
  activeFilter: MemorySearchFilter;
  isLoading: boolean;
  isSearching: boolean;
  memorySystemEnabled: boolean;
  selectedMemory: Memory | null;
  error: string | null;

  // Actions
  fetchMemories: (sourceType?: MemorySourceType, isActive?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  searchMemories: (query: string, filter?: MemorySearchFilter) => Promise<void>;
  indexMemory: (input: MemoryCreateInput) => Promise<Memory | null>;
  updateMemory: (id: string, input: MemoryUpdateInput) => Promise<Memory | null>;
  deleteMemory: (id: string, hard?: boolean) => Promise<boolean>;
  clearAllMemories: () => Promise<boolean>;
  toggleMemorySystem: (enabled: boolean) => void;
  setSelectedMemory: (memory: Memory | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: MemorySearchFilter) => void;
  resetSearch: () => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
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

      fetchMemories: async (sourceType, isActive = true) => {
        set({ isLoading: true, error: null });
        try {
          const items = await memoryApi.listMemories(50, 0, sourceType, isActive);
          set({ memories: items, isLoading: false });
        } catch (err: any) {
          set({
            error: err?.message || 'Failed to fetch memories',
            isLoading: false,
          });
        }
      },

      fetchStats: async () => {
        try {
          const stats = await memoryApi.getMemoryStats();
          set({ stats });
        } catch (err: any) {
          console.warn('Failed to fetch memory stats:', err);
        }
      },

      searchMemories: async (query, filter) => {
        if (!query.trim()) {
          set({ searchResults: [], isSearching: false });
          return;
        }
        set({ isSearching: true, searchQuery: query, error: null });
        try {
          const resp = await memoryApi.searchMemories({
            query,
            filter: filter || get().activeFilter,
            matchThreshold: 0.25,
            matchCount: 10,
            semanticWeight: 0.7,
            keywordWeight: 0.3,
          });
          set({ searchResults: resp.results, isSearching: false });
        } catch (err: any) {
          set({
            error: err?.message || 'Failed to search memories',
            isSearching: false,
          });
        }
      },

      indexMemory: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const created = await memoryApi.indexMemory(input);
          const current = get().memories;
          set({
            memories: [created, ...current.filter((m) => m.id !== created.id)],
            isLoading: false,
          });
          get().fetchStats();
          return created;
        } catch (err: any) {
          set({
            error: err?.message || 'Failed to index memory',
            isLoading: false,
          });
          return null;
        }
      },

      updateMemory: async (id, input) => {
        try {
          const updated = await memoryApi.updateMemory(id, input);
          const current = get().memories;
          set({
            memories: current.map((m) => (m.id === id ? updated : m)),
            selectedMemory: get().selectedMemory?.id === id ? updated : get().selectedMemory,
          });
          return updated;
        } catch (err: any) {
          set({ error: err?.message || 'Failed to update memory' });
          return null;
        }
      },

      deleteMemory: async (id, hard = false) => {
        try {
          await memoryApi.deleteMemory(id, hard);
          const current = get().memories;
          set({
            memories: current.filter((m) => m.id !== id),
            selectedMemory: get().selectedMemory?.id === id ? null : get().selectedMemory,
          });
          get().fetchStats();
          return true;
        } catch (err: any) {
          set({ error: err?.message || 'Failed to delete memory' });
          return false;
        }
      },

      clearAllMemories: async () => {
        try {
          await memoryApi.clearAllMemories();
          set({ memories: [], searchResults: [], selectedMemory: null });
          get().fetchStats();
          return true;
        } catch (err: any) {
          set({ error: err?.message || 'Failed to clear memories' });
          return false;
        }
      },

      toggleMemorySystem: (enabled) => {
        set({ memorySystemEnabled: enabled });
      },

      setSelectedMemory: (memory) => {
        set({ selectedMemory: memory });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setFilter: (filter) => {
        set({ activeFilter: filter });
      },

      resetSearch: () => {
        set({ searchQuery: '', searchResults: [], isSearching: false });
      },
    }),
    {
      name: 'saarathi-memory-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        memorySystemEnabled: state.memorySystemEnabled,
      }),
    }
  )
);
