import { NotificationService } from '@saarathi/api';
import { useNotificationStore, useTaskStore } from '@saarathi/store';

export class MobileNotificationHandler {
  /**
   * Initializes Expo Notification listeners and handler configuration on mobile startup.
   */
  public static async init(onOpenTask?: (taskId?: string) => void): Promise<() => void> {
    try {
      const Notifications = await (Function('return import("expo-notifications")')() as Promise<any>);
      if (!Notifications || !Notifications.setNotificationHandler) return () => {};

      // 1. Set foreground notification presentation options
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // 2. Configure Android notification channels
      await NotificationService.init();

      // 3. Listen to incoming foreground notifications
      const receivedSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
        const data = notification.request.content.data;
        useNotificationStore.getState().addNotification({
          title: notification.request.content.title || 'Saarathi Reminder',
          message: notification.request.content.body || '',
          type: data?.type || 'task_reminder',
          taskId: data?.taskId,
          reminderId: data?.reminderId,
          priority: data?.priority,
          reason: data?.reason,
        });
      });

      // 4. Listen to user interaction with notification (e.g. Tapping action button or notification card)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const actionIdentifier = response.actionIdentifier;
        const data = response.notification.request.content.data;

        if (actionIdentifier === 'done' && data?.taskId) {
          useTaskStore.getState().toggleTaskComplete(data.taskId);
        } else if (actionIdentifier === 'snooze_10' && data?.reminderId) {
          useNotificationStore.getState().snoozeReminder(data.reminderId, 10);
        } else if (actionIdentifier === 'snooze_30' && data?.reminderId) {
          useNotificationStore.getState().snoozeReminder(data.reminderId, 30);
        } else {
          // Default tap on notification body -> navigate to task
          if (onOpenTask) {
            onOpenTask(data?.taskId);
          }
        }
      });

      return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      };
    } catch {
      // Ignored in non-expo environments
      return () => {};
    }
  }
}
