import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryManagementView } from './MemoryManagementView';
import { useMemoryStore } from '@saarathi/store';
import { memoryApi } from '@saarathi/api';
import { Memory } from '@saarathi/types';

describe('MemoryManagementView', () => {
  const mockMemories: Memory[] = [
    {
      id: 'mem_1',
      userId: 'test_user',
      sourceType: 'brain_dump',
      content: 'Startup idea: AI vocational training platform',
      summary: 'Vocational training idea',
      importance: 0.9,
      confidence: 1.0,
      embeddingModel: 'all-MiniLM-L6-v2',
      embeddingVersion: '1.0.0',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:00:00Z',
      isActive: true,
    },
    {
      id: 'mem_2',
      userId: 'test_user',
      sourceType: 'user_preference',
      content: 'I prefer doing DSA in the morning',
      importance: 0.8,
      confidence: 1.0,
      embeddingModel: 'all-MiniLM-L6-v2',
      embeddingVersion: '1.0.0',
      createdAt: '2026-08-25T11:00:00Z',
      updatedAt: '2026-08-25T11:00:00Z',
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.spyOn(memoryApi, 'listMemories').mockImplementation(async (_l, _o, sourceType) => {
      if (sourceType) {
        return mockMemories.filter((m) => m.sourceType === sourceType);
      }
      return mockMemories;
    });

    vi.spyOn(memoryApi, 'getMemoryStats').mockResolvedValue({
      totalMemories: 2,
      activeMemories: 2,
      countsBySource: { brain_dump: 1, user_preference: 1 },
      embeddingModel: 'all-MiniLM-L6-v2',
      dimensions: 384,
    });

    useMemoryStore.setState({
      memories: mockMemories,
      stats: {
        totalMemories: 2,
        activeMemories: 2,
        countsBySource: { brain_dump: 1, user_preference: 1 },
        embeddingModel: 'all-MiniLM-L6-v2',
        dimensions: 384,
      },
      searchResults: [],
      isSearching: false,
      isLoading: false,
      memorySystemEnabled: true,
    });
  });

  it('renders memory management header, stats, and stored memories', async () => {
    render(<MemoryManagementView />);
    expect(screen.getByText(/Long-Term Memory & Hybrid Semantic Retrieval/i)).toBeDefined();
    expect(await screen.findByText(/Startup idea: AI vocational training platform/i)).toBeDefined();
    expect(await screen.findByText(/I prefer doing DSA in the morning/i)).toBeDefined();
    expect(screen.getByText('384')).toBeDefined();
  });

  it('filters memories by source type when tab clicked', async () => {
    render(<MemoryManagementView />);
    const brainDumpTab = screen.getByRole('button', { name: /Brain Dumps/i });
    fireEvent.click(brainDumpTab);

    expect(await screen.findByText(/Startup idea: AI vocational training platform/i)).toBeDefined();
  });

  it('opens add memory modal on button click', async () => {
    render(<MemoryManagementView />);
    const addBtn = screen.getByRole('button', { name: /Add Memory/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Add Long-Term Memory/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. I prefer doing difficult/i)).toBeDefined();
  });

  it('toggles memory engine state', async () => {
    render(<MemoryManagementView />);
    const toggleBtn = screen.getByText(/Memory Engine/i).parentElement?.querySelector('button');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(useMemoryStore.getState().memorySystemEnabled).toBe(false);
    }
  });
});
