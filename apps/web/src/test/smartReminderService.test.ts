import { describe, it, expect } from 'vitest';
import { SmartReminderService } from '@saarathi/api';
import { Task, Reminder, NotificationPreferences } from '@saarathi/types';

describe('SmartReminderService', () => {
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

  it('should recommend intelligent rescheduling for repeatedly snoozed/postponed tasks (Rule 2)', () => {
    const task: Task = {
      id: 'task_repeated',
      title: 'Gym Workout',
      estimatedDuration: 60,
      energyRequired: 'High',
      category: 'Health',
      priority: 'Medium',
      difficulty: 3,
      urgency: 'Medium',
      status: 'pending',
      aiSummary: 'Evening workout',
      skipProbability: 60,
      delayProbability: 70,
      postponeCount: 4,
      createdAt: new Date().toISOString(),
      tags: [],
      context: 'Home',
      subtasks: [],
    };

    const reminder: Reminder = {
      id: 'rem_repeated',
      userId: 'user_1',
      taskId: 'task_repeated',
      title: 'Gym Workout',
      body: 'Time for workout',
      scheduledAt: new Date().toISOString(),
      timezone: 'UTC',
      status: 'scheduled',
      type: 'task',
      priority: 'Medium',
      channel: 'local',
      isRecurring: false,
      createdAt: new Date().toISOString(),
      snoozeCount: 4,
      attemptCount: 1,
    };

    const result = SmartReminderService.evaluateRules({
      tasks: [task],
      reminders: [reminder],
      preferences: prefs,
      userEnergy: 'Medium',
      currentTime: new Date(),
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    const rec = result.recommendations.find((r) => r.taskId === 'task_repeated');
    expect(rec).toBeDefined();
    expect(rec?.triggerRule).toBe('RULE_REPEATED_SNOOZE');
    expect(rec?.reason).toContain('postponed');
  });

  it('should detect energy mismatch and recommend lighter slot (Rule 4)', () => {
    const heavyTask: Task = {
      id: 'task_heavy',
      title: 'Deep Machine Learning Research',
      estimatedDuration: 90,
      energyRequired: 'High',
      category: 'Research',
      priority: 'High',
      difficulty: 5,
      urgency: 'High',
      status: 'pending',
      aiSummary: 'Complex paper derivation',
      skipProbability: 10,
      delayProbability: 10,
      postponeCount: 0,
      createdAt: new Date().toISOString(),
      tags: [],
      context: 'Home',
      subtasks: [],
    };

    const result = SmartReminderService.evaluateRules({
      tasks: [heavyTask],
      reminders: [],
      preferences: prefs,
      userEnergy: 'Low', // User reported low energy
      currentTime: new Date(),
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    const energyRec = result.recommendations.find((r) => r.taskId === 'task_heavy');
    expect(energyRec).toBeDefined();
    expect(energyRec?.triggerRule).toBe('RULE_ENERGY_MISMATCH');
    expect(energyRec?.reason).toContain('Low');
  });

  it('should dispatch gentle smart nudge for tasks due soon that have not started (Rule 7)', () => {
    const now = new Date('2026-08-22T14:00:00Z');
    const deadlineSoon = new Date('2026-08-22T14:15:00Z').toISOString(); // Due in 15 mins

    const dueSoonTask: Task = {
      id: 'task_due_soon',
      title: 'Submit Weekly Report',
      estimatedDuration: 20,
      energyRequired: 'Medium',
      category: 'Work',
      priority: 'High',
      difficulty: 2,
      urgency: 'High',
      status: 'pending',
      deadline: deadlineSoon,
      aiSummary: 'Weekly report',
      skipProbability: 5,
      delayProbability: 10,
      postponeCount: 0,
      createdAt: now.toISOString(),
      tags: [],
      context: 'Office',
      subtasks: [],
    };

    const result = SmartReminderService.evaluateRules({
      tasks: [dueSoonTask],
      reminders: [],
      preferences: prefs,
      userEnergy: 'Medium',
      currentTime: now,
    });

    expect(result.notificationsToDispatch.length).toBeGreaterThan(0);
    const notif = result.notificationsToDispatch.find((n) => n.taskId === 'task_due_soon');
    expect(notif).toBeDefined();
    expect(notif?.type).toBe('smart_nudge');
    expect(notif?.message).toContain('quick version');
  });
});
