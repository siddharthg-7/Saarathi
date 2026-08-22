import { NotificationItem, UserDeviceRegistration } from '@saarathi/types';

export class PushNotificationService {
  /**
   * Dispatch a remote push notification via Expo Push Notification API.
   * Uses the free Expo push service endpoint without third-party SaaS dependencies.
   */
  public static async sendExpoPush(
    expoPushTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    if (!expoPushTokens.length) return false;

    const messages = expoPushTokens
      .filter((t) => t && t.startsWith('ExponentPushToken'))
      .map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }));

    if (!messages.length) return false;

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      return response.ok;
    } catch (err) {
      console.warn('Failed to send Expo push notification (graceful fallback):', err);
      return false;
    }
  }

  /**
   * Send notification to user's registered devices.
   */
  public static async broadcastToUserDevices(
    devices: UserDeviceRegistration[],
    notification: NotificationItem
  ): Promise<void> {
    const expoTokens = devices
      .filter((d) => d.enabled && d.pushProvider === 'expo' && d.token)
      .map((d) => d.token);

    if (expoTokens.length > 0) {
      await this.sendExpoPush(expoTokens, notification.title, notification.message, {
        notificationId: notification.id,
        taskId: notification.taskId,
        reminderId: notification.reminderId,
        type: notification.type,
      });
    }
  }
}
