import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineReminderSyncService, LocalNotificationService } from '@saarathi/api';
import { Task, Reminder, NotificationPreferences } from '@saarathi/types';

describe('OfflineReminderSyncService', () => {
  beforeEach(async () => {
    await LocalNotificationService.cancelAll();
  });

  const prefs: NotificationPreferences = {
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

  it('should cancel reminders for tasks completed while offline', async () => {
    const completedTask: Task = {
      id: 'task_offline_done',
      title: 'Offline Completed Task',
      estimatedDuration: 30,
      energyRequired: 'Medium',
      category: 'Work',
      status: 'completed', // completed while offline
      aiSummary: '',
      skipProbability: 0,
      delayProbability: 0,
      postponeCount: 0,
      createdAt: new Date().toISOString(),
      tags: [],
      context: 'Home',
      subtasks: [],
      difficulty: 1,
      urgency: 'Low',
    };

    const staleReminder: Reminder = {
      id: 'rem_stale_1',
      userId: 'user_1',
      taskId: 'task_offline_done',
      title: 'Offline Completed Task',
      body: 'Body',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      timezone: 'UTC',
      status: 'scheduled',
      type: 'task',
      priority: 'Medium',
      channel: 'local',
      isRecurring: false,
      createdAt: new Date().toISOString(),
      snoozeCount: 0,
      attemptCount: 0,
    };

    const result = await OfflineReminderSyncService.reconcileOfflineReminders(
      [completedTask],
      [staleReminder],
      prefs,
      'user_1'
    );

    expect(result.cancelledReminderIds).toContain('rem_stale_1');
  });

  it('should schedule missing reminders for pending tasks without duplicating', async () => {
    const futureDate = new Date(Date.now() + 2 * 3600 * 1000).toISOString();

    const pendingTask: Task = {
      id: 'task_offline_pending',
      title: 'Prepare Presentation',
      estimatedDuration: 45,
      energyRequired: 'High',
      category: 'Work',
      status: 'pending',
      deadline: futureDate,
      aiSummary: '',
      skipProbability: 0,
      delayProbability: 0,
      postponeCount: 0,
      createdAt: new Date().toISOString(),
      tags: [],
      context: 'Office',
      subtasks: [],
      difficulty: 3,
      urgency: 'High',
    };

    const result1 = await OfflineReminderSyncService.reconcileOfflineReminders(
      [pendingTask],
      [],
      prefs,
      'user_1'
    );

    expect(result1.scheduledReminderIds.length).toBe(1);

    // Second sync should not duplicate
    const result2 = await OfflineReminderSyncService.reconcileOfflineReminders(
      [pendingTask],
      [],
      prefs,
      'user_1'
    );

    expect(result2.scheduledReminderIds.length).toBe(0);
  });
});
