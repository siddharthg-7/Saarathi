import { describe, it, expect, beforeEach } from 'vitest';
import { ReminderScheduler, LocalNotificationService } from '@saarathi/api';
import { Task, NotificationPreferences } from '@saarathi/types';

describe('ReminderScheduler', () => {
  beforeEach(async () => {
    await LocalNotificationService.cancelAll();
  });

  const sampleTask: Task = {
    id: 'test_task_101',
    title: 'Complete Deep Learning Paper',
    estimatedDuration: 60,
    energyRequired: 'High',
    category: 'Study',
    priority: 'High',
    difficulty: 4,
    urgency: 'High',
    status: 'pending',
    aiSummary: 'Paper review',
    skipProbability: 10,
    delayProbability: 15,
    postponeCount: 0,
    scheduledTime: 'Tomorrow 08:00 AM',
    tags: ['Study'],
    context: 'Home',
    subtasks: [],
    createdAt: new Date().toISOString(),
  };

  const defaultPrefs: NotificationPreferences = {
    globalNotificationEnabled: true,
    taskReminderEnabled: true,
    smartReminderEnabled: true,
    dailyBriefEnabled: true,
    habitReminderEnabled: true,
    focusReminderEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: { enabled: false, start: '23:00', end: '07:00' },
    snoozeDefaults: [10, 30, 60],
    showSensitiveDetails: true,
  };

  it('should schedule a reminder for an active task', async () => {
    const reminder = await ReminderScheduler.scheduleTaskReminder(
      sampleTask,
      'user_123',
      defaultPrefs,
      'UTC'
    );

    expect(reminder).not.toBeNull();
    expect(reminder?.taskId).toBe('test_task_101');
    expect(reminder?.status).toBe('scheduled');
    expect(reminder?.type).toBe('task');
  });

  it('should not schedule reminder if task is already completed', async () => {
    const completedTask: Task = { ...sampleTask, status: 'completed' };
    const reminder = await ReminderScheduler.scheduleTaskReminder(
      completedTask,
      'user_123',
      defaultPrefs,
      'UTC'
    );

    expect(reminder).toBeNull();
  });

  it('should respect global notification disabled preference', async () => {
    const disabledPrefs: NotificationPreferences = {
      ...defaultPrefs,
      globalNotificationEnabled: false,
    };

    const reminder = await ReminderScheduler.scheduleTaskReminder(
      sampleTask,
      'user_123',
      disabledPrefs,
      'UTC'
    );

    expect(reminder).toBeNull();
  });

  it('should deduplicate identical notification scheduling', async () => {
    const scheduled1 = await LocalNotificationService.schedule({
      id: 'dedup_test_id_1',
      title: 'Task 1',
      body: 'Body 1',
      triggerDate: new Date(Date.now() + 60000),
    });
    expect(scheduled1).toBe(true);

    // Second attempt with same ID should be safely ignored
    const scheduled2 = await LocalNotificationService.schedule({
      id: 'dedup_test_id_1',
      title: 'Task 1 Duplicate',
      body: 'Body 1 Duplicate',
      triggerDate: new Date(Date.now() + 60000),
    });
    expect(scheduled2).toBe(false);
  });
});
