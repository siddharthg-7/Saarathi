import { describe, it, expect } from 'vitest';
import { MLFeatureExtractor } from '@saarathi/api';
import { Task, TelemetryEvent } from '@saarathi/types';

describe('MLFeatureExtractor Phase 9 Feature Extraction', () => {
  const mockTasks: Task[] = [
    {
      id: 'task_ml_1',
      title: 'Full-Stack Integration',
      category: 'Coding',
      energyRequired: 'High',
      priority: 'High',
      estimatedDuration: 90,
      difficulty: 4,
      urgency: 'High',
      status: 'completed',
      aiSummary: '',
      skipProbability: 15,
      delayProbability: 20,
      postponeCount: 0,
      deadline: '2026-08-23T20:00:00Z',
      tags: ['Coding'],
      context: 'Home',
      subtasks: [],
      createdAt: '2026-08-23T08:00:00Z',
    },
    {
      id: 'task_ml_2',
      title: 'Evening Workout',
      category: 'Fitness',
      energyRequired: 'High',
      priority: 'Medium',
      estimatedDuration: 60,
      difficulty: 3,
      urgency: 'Medium',
      status: 'skipped',
      aiSummary: '',
      skipProbability: 80,
      delayProbability: 70,
      postponeCount: 3,
      tags: ['Fitness'],
      context: 'Home',
      subtasks: [],
      createdAt: '2026-08-23T09:00:00Z',
    },
  ];

  it('should extract structured feature vectors matching the Phase 9 ML schema', () => {
    const features = MLFeatureExtractor.extractFeatures('usr_123', mockTasks);

    expect(features.length).toBe(2);

    const f1 = features[0];
    expect(f1.userId).toBe('usr_123');
    expect(f1.taskId).toBe('task_ml_1');
    expect(f1.taskCategory).toBe('Coding');
    expect(f1.priority).toBe('High');
    expect(f1.estimatedDuration).toBe(90);
    expect(f1.energyLevel).toBe('High');
    expect(f1.outcomeTarget).toBe('completed_on_time');

    const f2 = features[1];
    expect(f2.taskId).toBe('task_ml_2');
    expect(f2.taskCategory).toBe('Fitness');
    expect(f2.rescheduleCount).toBe(3);
    expect(f2.outcomeTarget).toBe('skipped');
  });

  it('should include notification and snooze counts from correlated telemetry events', () => {
    const events: TelemetryEvent[] = [
      {
        id: 'evt_notif_1',
        userId: 'usr_123',
        eventType: 'reminder_sent',
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        platform: 'web',
        sessionId: 'sess_1',
        entityType: 'reminder',
        entityId: 'task_ml_2',
        metadata: { taskId: 'task_ml_2' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'evt_snooze_1',
        userId: 'usr_123',
        eventType: 'reminder_snoozed',
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        platform: 'web',
        sessionId: 'sess_1',
        entityType: 'reminder',
        entityId: 'task_ml_2',
        metadata: { taskId: 'task_ml_2' },
        createdAt: new Date().toISOString(),
      },
    ];

    const features = MLFeatureExtractor.extractFeatures('usr_123', mockTasks, events);
    const f2 = features.find((f) => f.taskId === 'task_ml_2');

    expect(f2).toBeDefined();
    expect(f2?.notificationCount).toBe(1);
    expect(f2?.snoozeCount).toBe(1);
  });
});
