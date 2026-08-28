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
      undefined, // undefined userId skips Firestore network call in unit test
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
      undefined,
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
      undefined,
      disabledPrefs,
      'UTC'
    );

    expect(reminder).toBeNull();
  });

  it('should deduplicate identical notification scheduling', async () => {
    const reminder1 = await ReminderScheduler.scheduleTaskReminder(sampleTask, undefined, defaultPrefs, 'UTC');
    const reminder2 = await ReminderScheduler.scheduleTaskReminder(sampleTask, undefined, defaultPrefs, 'UTC');

    expect(reminder1).not.toBeNull();
    expect(reminder2).not.toBeNull();

    const notifId = LocalNotificationService.generateNotificationId(
      'local_user',
      sampleTask.id,
      reminder1!.scheduledAt
    );
    expect(LocalNotificationService.isScheduled(notifId)).toBe(true);
  });
});
