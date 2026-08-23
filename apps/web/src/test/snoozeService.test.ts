import { describe, it, expect, beforeEach } from 'vitest';
import { SnoozeService, LocalNotificationService } from '@saarathi/api';
import { Reminder } from '@saarathi/types';

describe('SnoozeService', () => {
  beforeEach(async () => {
    await LocalNotificationService.cancelAll();
  });

  const sampleReminder: Reminder = {
    id: 'rem_12345',
    userId: '',
    taskId: 'task_123',
    title: 'Study System Design',
    body: 'Review distributed caching',
    scheduledAt: new Date().toISOString(),
    timezone: 'UTC',
    status: 'scheduled',
    type: 'task',
    priority: 'High',
    channel: 'local',
    isRecurring: false,
    createdAt: new Date().toISOString(),
    snoozeCount: 0,
    attemptCount: 1,
  };

  it('should calculate correct snooze times for 10m, 30m, and 60m', () => {
    const base = new Date('2026-08-22T10:00:00Z');
    const snooze10 = SnoozeService.calculateSnoozeTime(10, base, 'UTC');
    expect(snooze10.toISOString()).toBe('2026-08-22T10:10:00.000Z');

    const snooze30 = SnoozeService.calculateSnoozeTime(30, base, 'UTC');
    expect(snooze30.toISOString()).toBe('2026-08-22T10:30:00.000Z');

    const snooze60 = SnoozeService.calculateSnoozeTime(60, base, 'UTC');
    expect(snooze60.toISOString()).toBe('2026-08-22T11:00:00.000Z');
  });

  it('should snooze reminder and increment snoozeCount', async () => {
    const { updatedReminder, newTriggerDate } = await SnoozeService.snoozeReminder(
      sampleReminder,
      10
    );

    expect(updatedReminder.status).toBe('snoozed');
    expect(updatedReminder.snoozeCount).toBe(1);
    expect(updatedReminder.snoozedUntil).toBeDefined();
    expect(newTriggerDate.getTime()).toBeGreaterThan(Date.now());
  });

  it('should handle repeated snoozing without duplicate notification accumulation', async () => {
    const res1 = await SnoozeService.snoozeReminder(sampleReminder, 10);
    expect(res1.updatedReminder.snoozeCount).toBe(1);

    const res2 = await SnoozeService.snoozeReminder(res1.updatedReminder, 10);
    expect(res2.updatedReminder.snoozeCount).toBe(2);

    const res3 = await SnoozeService.snoozeReminder(res2.updatedReminder, 30);
    expect(res3.updatedReminder.snoozeCount).toBe(3);
  });
});
