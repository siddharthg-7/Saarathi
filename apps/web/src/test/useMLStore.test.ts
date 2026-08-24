import { describe, it, expect, beforeEach } from 'vitest';
import { useMLStore } from '@saarathi/store';

describe('useMLStore (Phase 9 Zustand Store)', () => {
  beforeEach(() => {
    useMLStore.setState({
      taskRiskMap: {},
      energyClusters: [],
      optimalSlots: [],
      burnoutReport: null,
      forecast: null,
      taskClusters: [],
      loading: false,
      isColdStart: true,
      lastUpdated: null,
    });
  });

  it('should evaluate single task risk and update taskRiskMap', async () => {
    const store = useMLStore.getState();
    const prediction = await store.evaluateTaskRisk({
      id: 'task_store_1',
      title: 'Prepare executive quarterly report',
      postponeCount: 2,
      energyRequired: 'High',
      priority: 'High',
    });

    expect(prediction.taskId).toBe('task_store_1');
    expect(prediction.skipProbability).toBeGreaterThan(0);
    expect(useMLStore.getState().taskRiskMap['task_store_1']).toBeDefined();
  });

  it('should evaluate batch task risks and store predictions', async () => {
    const store = useMLStore.getState();
    await store.evaluateBatchTaskRisks([
      { id: 'batch_t1', title: 'Task 1', postponeCount: 0 },
      { id: 'batch_t2', title: 'Task 2', postponeCount: 3 },
    ]);

    const state = useMLStore.getState();
    expect(state.taskRiskMap['batch_t1']).toBeDefined();
    expect(state.taskRiskMap['batch_t2']).toBeDefined();
  });

  it('should fetch energy clusters and update state', async () => {
    const store = useMLStore.getState();
    await store.fetchEnergyClusters('user_123');

    const state = useMLStore.getState();
    expect(state.energyClusters.length).toBeGreaterThan(0);
    expect(state.optimalSlots.length).toBeGreaterThan(0);
  });

  it('should fetch burnout risk and store report', async () => {
    const store = useMLStore.getState();
    await store.fetchBurnoutRisk('user_123', [
      { date: '2026-08-22', focusMinutes: 350, tasksPlanned: 8, tasksCompleted: 4, tasksOverdue: 4, tasksRescheduled: 3 },
    ]);

    const state = useMLStore.getState();
    expect(state.burnoutReport).not.toBeNull();
    expect(state.burnoutReport?.burnoutRiskScore).toBeDefined();
  });

  it('should fetch productivity forecast and update state', async () => {
    const store = useMLStore.getState();
    await store.fetchProductivityForecast('user_123', [], 7);

    const state = useMLStore.getState();
    expect(state.forecast).not.toBeNull();
    expect(state.forecast?.forecastDays).toHaveLength(7);
  });

  it('should refresh all ML insights concurrently', async () => {
    const store = useMLStore.getState();
    await store.refreshAllMLInsights({
      userId: 'user_full_test',
      tasks: [
        { id: 't_all_1', title: 'Implement ML Pipelines', category: 'Backend' },
        { id: 't_all_2', title: 'Frontend UI testing', category: 'Frontend' },
      ],
    });

    const state = useMLStore.getState();
    expect(state.energyClusters.length).toBeGreaterThan(0);
    expect(state.burnoutReport).not.toBeNull();
    expect(state.forecast).not.toBeNull();
    expect(state.taskRiskMap['t_all_1']).toBeDefined();
    expect(state.lastUpdated).not.toBeNull();
  });
});
