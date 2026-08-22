import {
  Task,
  Reminder,
  NotificationItem,
  NotificationPreferences,
  NotificationPermissionStatus,
  SmartReminderRecommendation,
} from '@saarathi/types';
import { LocalNotificationService } from './localNotificationService';
import { NotificationPermissionsManager } from './notificationPermissions';
import { ReminderScheduler } from './reminderScheduler';
import { SnoozeService, SnoozeOption } from './snoozeService';
import { SmartReminderService, SmartRuleEvaluationContext, SmartRuleResult } from './smartReminderService';
import { DeviceRegistrationService } from './deviceRegistrationService';
import { PushNotificationService } from './pushNotificationService';
import { OfflineReminderSyncService, ReconcileResult } from './offlineReminderSync';
import {
  subscribeToReminders,
  subscribeToNotifications,
  createNotificationDoc,
  updateNotificationDoc,
  deleteNotificationDoc,
  getNotificationPreferences,
  saveNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './reminderFirestoreService';

export class NotificationService {
  /**
   * Initializes notification engine channels and services.
   */
  public static async init(): Promise<void> {
    await LocalNotificationService.setupAndroidChannels();
  }

  /**
   * Permissions
   */
  public static async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    return NotificationPermissionsManager.getPermissionStatus();
  }

  public static async requestPermission(): Promise<NotificationPermissionStatus> {
    return NotificationPermissionsManager.requestPermission();
  }

  /**
   * Scheduling
   */
  public static async scheduleTaskReminder(
    task: Task,
    userId?: string,
    preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
    timezone?: string
  ): Promise<Reminder | null> {
    return ReminderScheduler.scheduleTaskReminder(task, userId, preferences, timezone);
  }

  public static async cancelTaskReminders(taskId: string, userId?: string): Promise<void> {
    return ReminderScheduler.cancelTaskReminders(taskId, userId);
  }

  public static async markTaskRemindersCompleted(taskId: string, userId?: string): Promise<void> {
    return ReminderScheduler.markTaskRemindersCompleted(taskId, userId);
  }

  public static async rescheduleTask(
    task: Task,
    userId?: string,
    preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
    timezone?: string
  ): Promise<Reminder | null> {
    return ReminderScheduler.rescheduleTask(task, userId, preferences, timezone);
  }

  /**
   * Snooze
   */
  public static async snoozeReminder(
    reminder: Reminder,
    option: SnoozeOption,
    preferences?: NotificationPreferences
  ): Promise<{ updatedReminder: Reminder; newTriggerDate: Date }> {
    return SnoozeService.snoozeReminder(reminder, option, preferences);
  }

  /**
   * Smart Rule Engine
   */
  public static evaluateSmartRules(context: SmartRuleEvaluationContext): SmartRuleResult {
    return SmartReminderService.evaluateRules(context);
  }

  /**
   * Offline Reconciliation
   */
  public static async reconcileOffline(
    tasks: Task[],
    reminders: Reminder[],
    preferences: NotificationPreferences,
    userId?: string
  ): Promise<ReconcileResult> {
    return OfflineReminderSyncService.reconcileOfflineReminders(tasks, reminders, preferences, userId);
  }

  /**
   * In-app event listener
   */
  public static onInAppNotification(callback: (item: NotificationItem) => void): () => void {
    return LocalNotificationService.onInAppNotification(callback);
  }

  public static dispatchInAppNotification(item: NotificationItem): void {
    LocalNotificationService.dispatchInAppNotification(item);
  }
}

export * from './localNotificationService';
export * from './notificationPermissions';
export * from './reminderScheduler';
export * from './reminderFirestoreService';
export * from './snoozeService';
export * from './smartReminderService';
export * from './deviceRegistrationService';
export * from './pushNotificationService';
export * from './offlineReminderSync';
export * from './timezoneUtils';
