import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useXAIStore } from '@saarathi/store';
import { xaiApi } from '@saarathi/api';
import { XAIExplanation } from '@saarathi/types';

describe('useXAIStore State Management', () => {
  beforeEach(() => {
    useXAIStore.getState().invalidateCache();
    useXAIStore.setState({ activeModalExplanation: null });
  });

  it('fetches and caches task explanation', async () => {
    const mockExp: XAIExplanation = {
      explanationId: 'exp_store_1',
      taskId: 't_store_1',
      summary: 'High risk explanation',
      predictionType: 'task_risk',
      probability: 75.0,
      quality: 'moderate_evidence',
      contributors: [],
      evidence: [],
      modelMetadata: {
        modelName: 'task_risk_rf',
        modelVersion: '1.0.0',
        featureVersion: '1.0.0',
        explanationMethod: 'TreeLocalAttribution',
      },
      isColdStart: false,
      isFallback: false,
    };

    const spy = vi.spyOn(xaiApi, 'explainTask').mockResolvedValueOnce(mockExp);

    const result = await useXAIStore.getState().fetchTaskExplanation('t_store_1');
    expect(result.explanationId).toBe('exp_store_1');
    expect(useXAIStore.getState().explanationsByTaskId['t_store_1']).toBeDefined();

    // Subsequent call should hit cache without calling API again
    const cached = await useXAIStore.getState().fetchTaskExplanation('t_store_1');
    expect(cached.explanationId).toBe('exp_store_1');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('manages explanation modal state correctly', () => {
    const mockExp: XAIExplanation = {
      explanationId: 'exp_modal_1',
      taskId: 't_modal_1',
      summary: 'Modal test',
      predictionType: 'task_risk',
      probability: 60.0,
      quality: 'limited_evidence',
      contributors: [],
      evidence: [],
      modelMetadata: {
        modelName: 'task_risk_rf',
        modelVersion: '1.0.0',
        featureVersion: '1.0.0',
        explanationMethod: 'TreeLocalAttribution',
      },
      isColdStart: false,
      isFallback: false,
    };

    useXAIStore.getState().openExplanationModal(mockExp);
    expect(useXAIStore.getState().activeModalExplanation).toEqual(mockExp);

    useXAIStore.getState().closeExplanationModal();
    expect(useXAIStore.getState().activeModalExplanation).toBeNull();
  });

  it('invalidates cache by task ID or completely', async () => {
    useXAIStore.setState({
      explanationsByTaskId: {
        t1: { explanationId: 'exp1' } as any,
        t2: { explanationId: 'exp2' } as any,
      },
    });

    useXAIStore.getState().invalidateCache('t1');
    expect(useXAIStore.getState().explanationsByTaskId['t1']).toBeUndefined();
    expect(useXAIStore.getState().explanationsByTaskId['t2']).toBeDefined();

    useXAIStore.getState().invalidateCache();
    expect(Object.keys(useXAIStore.getState().explanationsByTaskId).length).toBe(0);
  });
});
