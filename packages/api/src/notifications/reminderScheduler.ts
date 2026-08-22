import {
  Task,
  Reminder,
  NotificationPreferences,
  ReminderStatus,
  ReminderPriority,
} from '@saarathi/types';
import { LocalNotificationService } from './localNotificationService';
import {
  createReminderDoc,
  updateReminderDoc,
  deleteReminderDoc,
  getRemindersForTask,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './reminderFirestoreService';
import { parseTaskTriggerTime, getEffectiveTimezone } from './timezoneUtils';
import { SmartReminderService } from './smartReminderService';

export class ReminderScheduler {
  /**
   * Schedules a reminder for a given task.
   */
  public static async scheduleTaskReminder(
    task: Task,
    userId?: string,
    preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
    timezone?: string
  ): Promise<Reminder | null> {
    if (!preferences.globalNotificationEnabled || !preferences.taskReminderEnabled) {
      return null;
    }

    if (task.status === 'completed') {
      return null;
    }

    const effectiveTz = getEffectiveTimezone(timezone);
    const triggerDate = parseTaskTriggerTime(task.deadline, task.scheduledTime, effectiveTz);
    const scheduledAtIso = triggerDate.toISOString();

    const effectiveUserId = userId || task.uid || 'local_user';
    const reminderId = `rem_${task.id}_${Date.now()}`;
    const deterministicId = LocalNotificationService.generateNotificationId(
      effectiveUserId,
      task.id,
      scheduledAtIso
    );

    // Build notification body adhering to privacy preferences
    const body = preferences.showSensitiveDetails
      ? `${task.category || 'General'} • Due: ${task.scheduledTime || 'Today'} • Energy: ${task.energyRequired}`
      : 'You have a scheduled task waiting in Saarathi.';

    const reminder: Reminder = {
      id: reminderId,
      userId: effectiveUserId,
      taskId: task.id,
      title: task.title,
      body,
      scheduledAt: scheduledAtIso,
      timezone: effectiveTz,
      status: 'scheduled' as ReminderStatus,
      type: 'task',
      priority: (task.priority as ReminderPriority) || 'Medium',
      channel: 'local',
      isRecurring: !!(task.recurrence && task.recurrence !== 'none'),
      recurrenceRule: task.recurrence !== 'none' ? task.recurrence : undefined,
      createdAt: new Date().toISOString(),
      snoozeCount: 0,
      attemptCount: 0,
    };

    // Check if should trigger or delayed by quiet hours
    const feasibility = SmartReminderService.shouldTriggerReminder(
      reminder,
      preferences,
      effectiveTz,
      triggerDate
    );

    const actualTriggerDate = feasibility.adjustedTriggerTime || triggerDate;

    // Schedule locally
    await LocalNotificationService.schedule({
      id: deterministicId,
      title: reminder.title,
      body: reminder.body,
      triggerDate: actualTriggerDate,
      sound: preferences.soundEnabled,
      vibrate: preferences.vibrationEnabled,
      data: {
        reminderId: reminder.id,
        taskId: task.id,
        type: reminder.type,
        priority: reminder.priority,
      },
    });

    // Persist to Firestore if user is authenticated
    if (userId) {
      await createReminderDoc(userId, reminder).catch((err) =>
        console.warn('Failed to persist reminder to Firestore:', err)
      );
    }

    return reminder;
  }

  /**
   * Cancels all reminders associated with a task (e.g. when completed or deleted).
   */
  public static async cancelTaskReminders(taskId: string, userId?: string): Promise<void> {
    if (userId) {
      const activeReminders = await getRemindersForTask(userId, taskId);
      for (const r of activeReminders) {
        const deterministicId = LocalNotificationService.generateNotificationId(
          r.userId,
          taskId,
          r.scheduledAt
        );
        await LocalNotificationService.cancel(deterministicId);
        await updateReminderDoc(userId, r.id, {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }
  }

  /**
   * Reschedules reminders when a task is edited or rescheduled.
   */
  public static async rescheduleTask(
    task: Task,
    userId?: string,
    preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
    timezone?: string
  ): Promise<Reminder | null> {
    await this.cancelTaskReminders(task.id, userId);
    return this.scheduleTaskReminder(task, userId, preferences, timezone);
  }

  /**
   * Marks a reminder completed when a task is done.
   */
  public static async markTaskRemindersCompleted(taskId: string, userId?: string): Promise<void> {
    if (userId) {
      const activeReminders = await getRemindersForTask(userId, taskId);
      for (const r of activeReminders) {
        const deterministicId = LocalNotificationService.generateNotificationId(
          r.userId,
          taskId,
          r.scheduledAt
        );
        await LocalNotificationService.cancel(deterministicId);
        await updateReminderDoc(userId, r.id, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }
  }
}
