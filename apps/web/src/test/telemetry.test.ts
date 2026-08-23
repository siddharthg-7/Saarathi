import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TelemetryClient } from '@saarathi/api';
import { TelemetryQueue } from '@saarathi/api';

describe('Telemetry Engine & Queue', () => {
  let queue: TelemetryQueue;

  beforeEach(() => {
    queue = TelemetryQueue.getInstance();
    queue.clear();
  });

  describe('TelemetryClient Event Creation & Sanitization', () => {
    it('should create a valid task telemetry event', async () => {
      const event = await TelemetryClient.trackTask('task_created', 'task_101', {
        title: 'Build Analytics',
        category: 'Coding',
        energyRequired: 'High',
        estimatedDuration: 45,
      });

      expect(event).toBeDefined();
      expect(event.id).toMatch(/^evt_/);
      expect(event.eventType).toBe('task_created');
      expect(event.entityType).toBe('task');
      expect(event.entityId).toBe('task_101');
      expect(event.timezone).toBeDefined();
      expect(event.platform).toBeDefined();
      expect(event.metadata.title).toBe('Build Analytics');
    });

    it('should sanitize sensitive credentials and tokens from metadata', async () => {
      const event = await TelemetryClient.trackTask('task_completed', 'task_102', {
        title: 'Sensitive Task',
        password: 'my-secret-password',
        authToken: 'bearer-token-12345',
        category: 'Personal',
      });

      expect(event.metadata.title).toBe('Sensitive Task');
      expect(event.metadata.category).toBe('Personal');
      expect((event.metadata as any).password).toBeUndefined();
      expect((event.metadata as any).authToken).toBeUndefined();
    });

    it('should track focus session telemetry correctly', async () => {
      const event = await TelemetryClient.trackFocus('focus_completed', 'foc_session_1', {
        taskId: 'task_101',
        mode: 'work',
        plannedDurationMinutes: 25,
        actualDurationSeconds: 1500,
        interruptionCount: 2,
        completionStatus: 'completed',
      });

      expect(event.eventType).toBe('focus_completed');
      expect(event.entityType).toBe('focus');
      expect(event.metadata.actualDurationSeconds).toBe(1500);
      expect(event.metadata.interruptionCount).toBe(2);
    });

    it('should track reminder interaction telemetry', async () => {
      const event = await TelemetryClient.trackReminder('reminder_opened', 'rem_999', {
        taskId: 'task_101',
        reminderType: 'task',
      });

      expect(event.eventType).toBe('reminder_opened');
      expect(event.entityType).toBe('reminder');
      expect(event.metadata.reminderId).toBe('rem_999');
    });

    it('should track explicit user energy and mood check-ins', async () => {
      const energyEvt = await TelemetryClient.trackEnergy('high', 'manual', 'Feeling ready');
      expect(energyEvt.eventType).toBe('energy_logged');
      expect(energyEvt.metadata.level).toBe('high');

      const moodEvt = await TelemetryClient.trackMood('very_good', 'daily_checkin');
      expect(moodEvt.eventType).toBe('mood_logged');
      expect(moodEvt.metadata.level).toBe('very_good');
    });
  });

  describe('TelemetryQueue & Deduplication', () => {
    it('should enqueue items and update queue status', () => {
      const event = {
        id: 'evt_dedup_1',
        userId: 'usr_test',
        eventType: 'task_created' as const,
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        platform: 'web' as const,
        sessionId: 'sess_1',
        entityType: 'task' as const,
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      queue.enqueue(event);
      const summary = queue.getStatusSummary();
      expect(summary.total).toBe(1);
      expect(summary.pending).toBe(1);
    });

    it('should deduplicate events with identical IDs', () => {
      const event = {
        id: 'evt_identical_1',
        userId: 'usr_test',
        eventType: 'task_completed' as const,
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        platform: 'web' as const,
        sessionId: 'sess_1',
        entityType: 'task' as const,
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      queue.enqueue(event);
      queue.enqueue(event); // Second call should be ignored by deduplication

      const items = queue.getItems();
      expect(items.length).toBe(1);
    });
  });
});
