import { Reminder, NotificationPreferences } from '@saarathi/types';
import { LocalNotificationService } from './localNotificationService';
import { updateReminderDoc } from './reminderFirestoreService';
import { getEffectiveTimezone } from './timezoneUtils';

export type SnoozeOption = 10 | 30 | 60 | 'tomorrow' | string; // minutes or 'tomorrow' or ISO date string

export class SnoozeService {
  /**
   * Computes the new trigger Date based on the snooze option.
   */
  public static calculateSnoozeTime(
    option: SnoozeOption,
    fromDate: Date = new Date(),
    timezone?: string
  ): Date {
    const effectiveTz = getEffectiveTimezone(timezone);

    if (typeof option === 'number') {
      return new Date(fromDate.getTime() + option * 60 * 1000);
    }

    if (option === 'tomorrow') {
      const tomorrow = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
      const dFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: effectiveTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const tomorrowDateStr = dFormatter.format(tomorrow);
      // Tomorrow at 09:00 AM
      return new Date(`${tomorrowDateStr}T09:00:00`);
    }

    // Custom ISO timestamp
    const parsed = Date.parse(option);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }

    // Fallback: 15 minutes
    return new Date(fromDate.getTime() + 15 * 60 * 1000);
  }

  /**
   * Execute snooze on a reminder.
   */
  public static async snoozeReminder(
    reminder: Reminder,
    option: SnoozeOption,
    preferences?: NotificationPreferences
  ): Promise<{ updatedReminder: Reminder; newTriggerDate: Date }> {
    const newTriggerDate = this.calculateSnoozeTime(option, new Date(), reminder.timezone);
    const newScheduledAt = newTriggerDate.toISOString();

    // 1. Cancel previous local notification
    const oldNotificationId = LocalNotificationService.generateNotificationId(
      reminder.userId,
      reminder.taskId || reminder.id,
      reminder.scheduledAt
    );
    await LocalNotificationService.cancel(oldNotificationId);

    // 2. Compute updated reminder fields
    const nextSnoozeCount = (reminder.snoozeCount || 0) + 1;
    const updatedReminder: Reminder = {
      ...reminder,
      status: 'snoozed',
      scheduledAt: newScheduledAt,
      snoozedUntil: newScheduledAt,
      snoozeCount: nextSnoozeCount,
      updatedAt: new Date().toISOString(),
    };

    // 3. Persist to Firestore if authenticated
    if (reminder.userId) {
      updateReminderDoc(reminder.userId, reminder.id, {
        status: 'snoozed',
        scheduledAt: newScheduledAt,
        snoozedUntil: newScheduledAt,
        snoozeCount: nextSnoozeCount,
      }).catch((err) => console.warn('Failed to update snoozed reminder in Firestore:', err));
    }

    // 4. Schedule new local notification
    const newNotificationId = LocalNotificationService.generateNotificationId(
      reminder.userId,
      reminder.taskId || reminder.id,
      newScheduledAt
    );

    await LocalNotificationService.schedule({
      id: newNotificationId,
      title: reminder.title,
      body: `Snoozed: ${reminder.body}`,
      triggerDate: newTriggerDate,
      sound: preferences?.soundEnabled ?? true,
      vibrate: preferences?.vibrationEnabled ?? true,
      data: {
        reminderId: reminder.id,
        taskId: reminder.taskId,
        type: reminder.type,
        priority: reminder.priority,
        snoozeCount: nextSnoozeCount,
      },
    });

    return { updatedReminder, newTriggerDate };
  }
}
