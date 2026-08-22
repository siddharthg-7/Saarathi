import { Task, Reminder, NotificationPreferences } from '@saarathi/types';
import { LocalNotificationService } from './localNotificationService';
import { SmartReminderService } from './smartReminderService';
import { parseTaskTriggerTime } from './timezoneUtils';

export interface ReconcileResult {
  cancelledReminderIds: string[];
  scheduledReminderIds: string[];
  reconciledCount: number;
}

export class OfflineReminderSyncService {
  /**
   * Reconcile local scheduled reminders with current task and reminder state from Firestore.
   */
  public static async reconcileOfflineReminders(
    tasks: Task[],
    reminders: Reminder[],
    preferences: NotificationPreferences,
    userId?: string
  ): Promise<ReconcileResult> {
    const result: ReconcileResult = {
      cancelledReminderIds: [],
      scheduledReminderIds: [],
      reconciledCount: 0,
    };

    const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
    const now = new Date();

    // 1. Process existing reminders: cancel obsolete or completed ones
    for (const reminder of reminders) {
      const associatedTask = reminder.taskId ? taskMap.get(reminder.taskId) : null;

      // If associated task is completed or was deleted
      if ((reminder.taskId && !associatedTask) || associatedTask?.status === 'completed') {
        const notifId = LocalNotificationService.generateNotificationId(
          reminder.userId,
          reminder.taskId || reminder.id,
          reminder.scheduledAt
        );
        await LocalNotificationService.cancel(notifId);
        result.cancelledReminderIds.push(reminder.id);
        continue;
      }

      // If scheduled time has already passed
      const scheduledTime = Date.parse(reminder.scheduledAt);
      if (!isNaN(scheduledTime) && scheduledTime < now.getTime()) {
        continue;
      }

      // Check smart trigger feasibility (e.g. quiet hours, preferences)
      const triggerCheck = SmartReminderService.shouldTriggerReminder(
        reminder,
        preferences,
        reminder.timezone,
        now
      );

      if (triggerCheck.canTrigger) {
        const notifId = LocalNotificationService.generateNotificationId(
          reminder.userId,
          reminder.taskId || reminder.id,
          reminder.scheduledAt
        );

        if (!LocalNotificationService.isScheduled(notifId)) {
          await LocalNotificationService.schedule({
            id: notifId,
            title: reminder.title,
            body: reminder.body,
            triggerDate: new Date(scheduledTime),
            sound: preferences.soundEnabled,
            vibrate: preferences.vibrationEnabled,
            data: {
              reminderId: reminder.id,
              taskId: reminder.taskId,
              type: reminder.type,
              priority: reminder.priority,
            },
          });
          result.scheduledReminderIds.push(reminder.id);
        }
      }
    }

    // 2. Process tasks that have scheduledTime/deadlines but missing local reminders
    if (preferences.globalNotificationEnabled && preferences.taskReminderEnabled) {
      for (const task of tasks) {
        if (task.status === 'completed') continue;

        if (task.scheduledTime || task.deadline) {
          const triggerDate = parseTaskTriggerTime(task.deadline, task.scheduledTime);
          if (triggerDate.getTime() > now.getTime()) {
            const notifId = LocalNotificationService.generateNotificationId(
              userId || task.uid || 'local',
              task.id,
              triggerDate.toISOString()
            );

            if (!LocalNotificationService.isScheduled(notifId)) {
              await LocalNotificationService.schedule({
                id: notifId,
                title: `Task: ${task.title}`,
                body: preferences.showSensitiveDetails
                  ? `Scheduled for ${task.scheduledTime || 'now'}. Priority: ${task.priority || 'Medium'}`
                  : 'You have a task waiting in Saarathi.',
                triggerDate,
                sound: preferences.soundEnabled,
                vibrate: preferences.vibrationEnabled,
                data: {
                  taskId: task.id,
                  type: 'task_reminder',
                  priority: task.priority || 'Medium',
                },
              });
              result.scheduledReminderIds.push(notifId);
            }
          }
        }
      }
    }

    result.reconciledCount = result.scheduledReminderIds.length + result.cancelledReminderIds.length;
    return result;
  }
}
