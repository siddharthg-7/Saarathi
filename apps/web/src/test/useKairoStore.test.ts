import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useKairoStore } from '@saarathi/store';
import { kairoApi } from '@saarathi/api';
import { KairoSuggestedAction } from '@saarathi/types';

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
    expect(useKairoStore.getState().visualState).toBe('IDLE');
  });

  it('should toggle speech synthesis and manage visual states', () => {
    expect(useKairoStore.getState().speechSynthesisEnabled).toBe(false);
    useKairoStore.getState().toggleSpeechSynthesis();
    expect(useKairoStore.getState().speechSynthesisEnabled).toBe(true);

    useKairoStore.getState().setListening(true);
    expect(useKairoStore.getState().isListening).toBe(true);
    expect(useKairoStore.getState().visualState).toBe('LISTENING');

    useKairoStore.getState().setListening(false);
    expect(useKairoStore.getState().visualState).toBe('IDLE');

    useKairoStore.getState().setSpeaking(true);
    expect(useKairoStore.getState().isSpeaking).toBe(true);
    expect(useKairoStore.getState().visualState).toBe('SPEAKING');

    useKairoStore.getState().setSpeaking(false);
    expect(useKairoStore.getState().visualState).toBe('IDLE');
  });

  it('should dispatch action callbacks to registered listeners', () => {
    const executedActions: KairoSuggestedAction[] = [];
    useKairoStore.getState().setActionCallback((act) => {
      executedActions.push(act);
    });

    const actionToRun: KairoSuggestedAction = {
      actionType: 'COMPLETE_TASK',
      taskId: 'task-123',
      label: 'Complete Task',
    };

    useKairoStore.getState().executeAction(actionToRun);
    expect(executedActions.length).toBe(1);
    expect(executedActions[0].actionType).toBe('COMPLETE_TASK');
    expect(executedActions[0].taskId).toBe('task-123');
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

  it('should switch voice personas dynamically', () => {
    expect(useKairoStore.getState().selectedVoicePersona).toBe('Puck');
    useKairoStore.getState().setVoicePersona('Kore');
    expect(useKairoStore.getState().selectedVoicePersona).toBe('Kore');
    useKairoStore.getState().setVoicePersona('Charon');
    expect(useKairoStore.getState().selectedVoicePersona).toBe('Charon');
  });

  it('should handle barge-in interruptions cleanly', () => {
    useKairoStore.setState({ isSpeaking: true, visualState: 'SPEAKING' });
    expect(useKairoStore.getState().isSpeaking).toBe(true);

    useKairoStore.getState().bargeIn();
    expect(useKairoStore.getState().isSpeaking).toBe(false);
    expect(useKairoStore.getState().visualState).toBe('LISTENING');
  });

  it('should stop live voice session and reset audio state', () => {
    useKairoStore.setState({
      liveVoiceActive: true,
      isListening: true,
      liveTranscript: 'Streaming voice transcript...',
      visualState: 'LISTENING',
    });

    useKairoStore.getState().stopLiveVoice();
    expect(useKairoStore.getState().liveVoiceActive).toBe(false);
    expect(useKairoStore.getState().isListening).toBe(false);
    expect(useKairoStore.getState().liveTranscript).toBe('');
    expect(useKairoStore.getState().visualState).toBe('IDLE');
  });
});

