import { describe, it, expect, vi } from 'vitest';
import { mlApi } from '@saarathi/api';

describe('ML API Client (Phase 9 Machine Learning Foundation)', () => {
  it('should predict single task risk with cold-start resilience', async () => {
    const res = await mlApi.predictTaskRisk({
      id: 'task_ml_101',
      title: 'Design distributed database architecture',
      category: 'Engineering',
      priority: 'High',
      postponeCount: 2,
      energyRequired: 'High',
      estimatedDuration: 90,
    });

    expect(res.taskId).toBe('task_ml_101');
    expect(res.skipProbability).toBeGreaterThan(0);
    expect(res.delayProbability).toBeGreaterThan(0);
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(res.riskLevel);
    expect(res.explanation).toBeDefined();
    expect(res.recommendedAction).toBeDefined();
  });

  it('should predict batch task risks for multiple tasks', async () => {
    const res = await mlApi.predictBatchRisk([
      {
        id: 'task_1',
        title: 'Quick email check',
        category: 'Admin',
        priority: 'Low',
        postponeCount: 0,
      },
      {
        id: 'task_2',
        title: 'Implement ML model serving',
        category: 'Engineering',
        priority: 'Critical',
        postponeCount: 3,
      },
    ]);

    expect(res.predictions).toHaveLength(2);
    expect(res.highRiskCount).toBeGreaterThanOrEqual(1);
    expect(res.predictions[0].skipProbability).toBeLessThan(res.predictions[1].skipProbability);
  });

  it('should retrieve energy clusters with peak deep work and optimal slots', async () => {
    const res = await mlApi.getEnergyClusters('user_test_123');

    expect(res.userId).toBe('user_test_123');
    expect(res.clusters.length).toBeGreaterThanOrEqual(2);
    expect(res.optimalTimeSlots.length).toBeGreaterThanOrEqual(1);
    expect(res.dominantPeakHour).toBeGreaterThanOrEqual(0);
  });

  it('should detect burnout risk and return workload indicators', async () => {
    const res = await mlApi.detectBurnoutRisk('user_test_123', [
      { date: '2026-08-20', focusMinutes: 400, tasksPlanned: 10, tasksCompleted: 4, tasksOverdue: 5, tasksRescheduled: 3 },
      { date: '2026-08-21', focusMinutes: 380, tasksPlanned: 12, tasksCompleted: 5, tasksOverdue: 6, tasksRescheduled: 4 },
    ]);

    expect(res.userId).toBe('user_test_123');
    expect(res.burnoutRiskScore).toBeGreaterThan(0);
    expect(['low', 'moderate', 'high']).toContain(res.riskLevel);
    expect(res.contributingIndicators.length).toBeGreaterThan(0);
    expect(res.recommendations.length).toBeGreaterThan(0);
  });

  it('should return 7-day productivity and focus forecast', async () => {
    const res = await mlApi.getProductivityForecast('user_test_123', [], 7);

    expect(res.userId).toBe('user_test_123');
    expect(res.forecastDays).toHaveLength(7);
    expect(res.expectedWeeklyCompleted).toBeGreaterThan(0);
    expect(res.expectedWeeklyFocusMinutes).toBeGreaterThan(0);
    expect(['upward', 'steady', 'downward']).toContain(res.trendDirection);
  });

  it('should cluster tasks semantically by topic', async () => {
    const res = await mlApi.clusterTasks([
      { id: 't1', title: 'Python backend API route', category: 'Backend', tags: ['fastapi'] },
      { id: 't2', title: 'PostgreSQL database query optimization', category: 'Backend', tags: ['sql'] },
      { id: 't3', title: 'React frontend button component', category: 'Frontend', tags: ['ui'] },
    ]);

    expect(res.totalTasks).toBe(3);
    expect(res.clusters.length).toBeGreaterThanOrEqual(1);
  });
});
