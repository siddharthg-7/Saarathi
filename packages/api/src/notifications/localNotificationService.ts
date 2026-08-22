import { Reminder, NotificationItem, NotificationPreferences } from '@saarathi/types';

export interface LocalNotificationPayload {
  id: string; // Deterministic ID: `${userId}_${taskId}_${scheduledAt}`
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, any>;
  sound?: boolean;
  vibrate?: boolean;
}

const getExpoNotifications = async (): Promise<any> => {
  try {
    return await (Function('return import("expo-notifications")')() as Promise<any>);
  } catch {
    return null;
  }
};

export class LocalNotificationService {
  // In-memory registry of active local timer IDs (for Web / Node fallback)
  private static scheduledTimers: Map<string, number> = new Map();
  // Scheduled ID deduplication cache
  private static scheduledIds: Set<string> = new Set();
  // Event listener callback for in-app delivery
  private static inAppListeners: Set<(item: NotificationItem) => void> = new Set();

  /**
   * Generate a deterministic notification ID.
   */
  public static generateNotificationId(
    userId: string,
    taskId: string,
    scheduledAt: string
  ): string {
    return `${userId}_${taskId}_${scheduledAt}`;
  }

  /**
   * Subscribe to local in-app notification triggers.
   */
  public static onInAppNotification(listener: (item: NotificationItem) => void): () => void {
    this.inAppListeners.add(listener);
    return () => {
      this.inAppListeners.delete(listener);
    };
  }

  /**
   * Dispatches an in-app notification event to all registered UI listeners.
   */
  public static dispatchInAppNotification(item: NotificationItem): void {
    this.inAppListeners.forEach((listener) => {
      try {
        listener(item);
      } catch (err) {
        console.error('Error in in-app notification listener:', err);
      }
    });
  }

  /**
   * Check if a deterministic notification is already scheduled.
   */
  public static isScheduled(id: string): boolean {
    return this.scheduledIds.has(id);
  }

  /**
   * Configure notification channels on Android (called during app startup).
   */
  public static async setupAndroidChannels(): Promise<void> {
    try {
      const Notifications = await getExpoNotifications();
      if (Notifications && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('smart-nudges', {
          name: 'Smart Productivity Nudges',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 150, 150, 150],
          lightColor: '#10B981',
          sound: 'default',
        });
      }
    } catch {
      // expo-notifications not available in non-mobile environments
    }
  }

  /**
   * Schedule a local notification.
   */
  public static async schedule(payload: LocalNotificationPayload): Promise<boolean> {
    const { id, title, body, triggerDate, data } = payload;

    // Deduplication check
    if (this.scheduledIds.has(id)) {
      return false;
    }

    const now = Date.now();
    const delayMs = Math.max(0, triggerDate.getTime() - now);

    this.scheduledIds.add(id);

    // 1. Mobile App: expo-notifications
    let scheduledWithExpo = false;
    try {
      const Notifications = await getExpoNotifications();
      if (Notifications && Notifications.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title,
            body,
            data: data || {},
            sound: payload.sound !== false,
            vibrate: payload.vibrate !== false ? [0, 250, 250, 250] : undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          } as any,
        });
        scheduledWithExpo = true;
      }
    } catch {
      // Not in mobile environment or expo-notifications not loaded
    }

    // 2. Web / Browser & in-app timer fallback
    // We set a local setTimeout so the in-app notification center and browser notification fire when open
    if (typeof window !== 'undefined' || !scheduledWithExpo) {
      if (this.scheduledTimers.has(id)) {
        clearTimeout(this.scheduledTimers.get(id));
      }

      const timerId = window?.setTimeout(() => {
        this.scheduledTimers.delete(id);
        this.scheduledIds.delete(id);

        // Fire browser notification if allowed
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: id,
              data: data || {},
            });
          } catch (e) {
            console.warn('Could not display Web Notification:', e);
          }
        }

        // Fire in-app notification item
        const notifItem: NotificationItem = {
          id: `notif_${Date.now()}`,
          title,
          message: body,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          type: (data?.type as any) || 'task_reminder',
          read: false,
          taskId: data?.taskId,
          reminderId: data?.reminderId,
          priority: data?.priority || 'Medium',
          reason: data?.reason,
          actions: [
            { actionId: 'done', label: 'Done' },
            { actionId: 'snooze_10', label: 'Snooze 10m' },
          ],
        };

        this.dispatchInAppNotification(notifItem);
      }, Math.min(delayMs, 2147483647)) as unknown as number;

      this.scheduledTimers.set(id, timerId);
    }

    return true;
  }

  /**
   * Cancel a scheduled local notification.
   */
  public static async cancel(id: string): Promise<void> {
    this.scheduledIds.delete(id);

    // Cancel timer
    if (this.scheduledTimers.has(id)) {
      clearTimeout(this.scheduledTimers.get(id));
      this.scheduledTimers.delete(id);
    }

    // Cancel in expo-notifications
    try {
      const Notifications = await getExpoNotifications();
      if (Notifications && Notifications.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch {
      // Ignored
    }
  }

  /**
   * Cancel all scheduled notifications.
   */
  public static async cancelAll(): Promise<void> {
    this.scheduledIds.clear();
    this.scheduledTimers.forEach((timerId) => clearTimeout(timerId));
    this.scheduledTimers.clear();

    try {
      const Notifications = await getExpoNotifications();
      if (Notifications && Notifications.cancelAllScheduledNotificationsAsync) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch {
      // Ignored
    }
  }
}
