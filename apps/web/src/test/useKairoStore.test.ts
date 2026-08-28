import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useKairoStore } from '@saarathi/store';
import { kairoApi } from '@saarathi/api';

describe('useKairoStore', () => {
  beforeEach(() => {
    useKairoStore.getState().clearHistory();
    // Stub global WebSocket to undefined so it gracefully falls back to REST
    vi.stubGlobal('WebSocket', undefined);
    vi.spyOn(kairoApi, 'sendMessage').mockResolvedValue({
      role: 'assistant',
      message: 'Here is your personalized productivity advice from REST fallback.',
      timestamp: '2026-08-28T08:00:00Z',
      source: 'kairo-rest-fallback',
      suggestedActions: [
        { actionType: 'START_TASK', taskId: 't1', label: 'Start Task' },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with empty chat history when cleared', () => {
    expect(useKairoStore.getState().chatHistory).toEqual([]);
    expect(useKairoStore.getState().isThinking).toBe(false);
  });

  it('should append user message and trigger assistant response via fallback', async () => {
    await useKairoStore.getState().sendMessage('How should I prioritize today?');

    const history = useKairoStore.getState().chatHistory;
    expect(history.length).toBe(2);

    const userMsg = history[0];
    expect(userMsg.role).toBe('user');
    expect(userMsg.message).toBe('How should I prioritize today?');

    const assistantMsg = history[1];
    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.message).toContain('Here is your personalized productivity advice');
    expect(useKairoStore.getState().isThinking).toBe(false);
  });

  it('should clear history cleanly', () => {
    useKairoStore.setState({
      chatHistory: [
        { id: '1', role: 'user', message: 'Hello', timestamp: '10:00 AM' },
        { id: '2', role: 'assistant', message: 'Hi there', timestamp: '10:01 AM' },
      ],
    });

    expect(useKairoStore.getState().chatHistory.length).toBe(2);
    useKairoStore.getState().clearHistory();
    expect(useKairoStore.getState().chatHistory).toEqual([]);
  });
});
