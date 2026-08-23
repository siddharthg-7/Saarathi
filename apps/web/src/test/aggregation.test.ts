import { describe, it, expect } from 'vitest';
import { AggregationEngine } from '@saarathi/api';
import { Task, Reminder, Habit, TelemetryEvent } from '@saarathi/types';

describe('AggregationEngine Metrics & Summaries', () => {
  describe('safePercentageChange', () => {
    it('should return 0 when previous is 0 and current is 0', () => {
      expect(AggregationEngine.safePercentageChange(0, 0)).toBe(0);
    });

    it('should return 100 when previous is 0 and current is positive', () => {
      expect(AggregationEngine.safePercentageChange(10, 0)).toBe(100);
    });

    it('should compute standard positive and negative percentage changes', () => {
      expect(AggregationEngine.safePercentageChange(120, 100)).toBe(20);
      expect(AggregationEngine.safePercentageChange(75, 100)).toBe(-25);
    });
  });

  describe('calculateProductivityScore', () => {
    it('should compute score based on completion rate, focus time, and on-time rate', () => {
      // 100% completion (40pts) + 240m focus (40pts) + 100% on time (20pts) = 100
      const perfectScore = AggregationEngine.calculateProductivityScore(100, 240, 100);
      expect(perfectScore).toBe(100);

      // 50% completion (20pts) + 120m focus (20pts) + 50% on time (10pts) = 50
      const midScore = AggregationEngine.calculateProductivityScore(50, 120, 50);
      expect(midScore).toBe(50);
    });

    it('should clamp score between 0 and 100', () => {
      expect(AggregationEngine.calculateProductivityScore(100, 600, 100)).toBe(100);
      expect(AggregationEngine.calculateProductivityScore(0, 0, 0)).toBe(0);
    });
  });

  describe('aggregateDaily', () => {
    const mockTasks: Task[] = [
      {
        id: 't1',
        title: 'Task 1',
        estimatedDuration: 45,
        energyRequired: 'High',
        category: 'Coding',
        difficulty: 3,
        urgency: 'High',
        status: 'completed',
        aiSummary: '',
        skipProbability: 10,
        delayProbability: 10,
        postponeCount: 0,
        tags: [],
        context: 'Home',
        subtasks: [],
        createdAt: '2026-08-23T08:00:00Z',
      },
      {
        id: 't2',
        title: 'Task 2',
        estimatedDuration: 30,
        energyRequired: 'Medium',
        category: 'College',
        difficulty: 2,
        urgency: 'Medium',
        status: 'completed',
        aiSummary: '',
        skipProbability: 10,
        delayProbability: 10,
        postponeCount: 1,
        tags: [],
        context: 'Home',
        subtasks: [],
        createdAt: '2026-08-23T09:00:00Z',
      },
      {
        id: 't3',
        title: 'Task 3',
        estimatedDuration: 60,
        energyRequired: 'Low',
        category: 'Personal',
        difficulty: 1,
        urgency: 'Low',
        status: 'pending',
        aiSummary: '',
        skipProbability: 10,
        delayProbability: 10,
        postponeCount: 0,
        tags: [],
        context: 'Home',
        subtasks: [],
        createdAt: '2026-08-23T10:00:00Z',
      },
    ];

    it('should aggregate task completion, on-time, and reschedule counts correctly', () => {
      const daily = AggregationEngine.aggregateDaily('usr_1', mockTasks, [], [], [], '2026-08-23');

      expect(daily.tasksPlanned).toBe(3);
      expect(daily.tasksCompleted).toBe(2);
      expect(daily.tasksCompletedOnTime).toBe(1); // t1 had 0 postponeCount
      expect(daily.tasksRescheduled).toBe(1);      // t2 had 1 postponeCount
      expect(daily.completionRate).toBe(67);       // 2/3 = 66.67 -> 67%
      expect(daily.hourlyActivity?.length).toBe(24);
    });
  });

  describe('generateHeatmapGrid', () => {
    it('should return a 7x24 grid with valid intensities and days of week', () => {
      const grid = AggregationEngine.generateHeatmapGrid([], []);
      expect(grid.cells.length).toBe(7 * 24);
      expect(grid.maxCount).toBeGreaterThanOrEqual(1);

      // Verify each day of week (0 to 6) has 24 hour cells
      for (let d = 0; d < 7; d++) {
        const dayCells = grid.cells.filter((c) => c.dayOfWeek === d);
        expect(dayCells.length).toBe(24);
      }
    });
  });

  describe('evaluateColdStart', () => {
    it('should return zero_data phase when events and tasks are empty', () => {
      const status = AggregationEngine.evaluateColdStart([], []);
      expect(status.phase).toBe('zero_data');
      expect(status.isUnlocked.overview).toBe(false);
    });

    it('should unlock long-term trends when sufficient events are present', () => {
      const mockEvents = Array.from({ length: 60 }).map((_, i) => ({
        id: `e_${i}`,
        userId: 'usr_1',
        eventType: 'task_completed' as const,
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        platform: 'web' as const,
        sessionId: 's_1',
        entityType: 'task' as const,
        metadata: {},
        createdAt: new Date().toISOString(),
      }));

      const status = AggregationEngine.evaluateColdStart(mockEvents, []);
      expect(status.phase).toBe('long_term_trends');
      expect(status.isUnlocked.overview).toBe(true);
      expect(status.isUnlocked.heatmap).toBe(true);
      expect(status.isUnlocked.patterns).toBe(true);
    });
  });
});
