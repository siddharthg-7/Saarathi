import { NotificationPermissionStatus } from '@saarathi/types';

export class NotificationPermissionsManager {
  /**
   * Check the current notification permission status in a platform-safe manner.
   */
  public static async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    // 1. Browser Web environment
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      if (perm === 'granted') return 'granted';
      if (perm === 'denied') return 'denied';
      return 'default';
    }

    // 2. React Native / Expo environment
    try {
      // Platform-safe dynamic loader
      const getExpoNotifications = async (): Promise<any> => {
        try {
          return await (Function('return import("expo-notifications")')() as Promise<any>);
        } catch {
          return null;
        }
      };

      const Notifications = await getExpoNotifications();
      if (Notifications && Notifications.getPermissionsAsync) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') return 'granted';
        if (status === 'denied') return 'denied';
        if (status === 'undetermined') return 'default';
        return 'provisional';
      }
    } catch {
      // expo-notifications not available in this environment
    }

    return 'unavailable';
  }

  /**
   * Request notification permission contextually after the user expresses intent.
   */
  public static async requestPermission(): Promise<NotificationPermissionStatus> {
    // 1. Browser Web environment
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') return 'granted';
        if (permission === 'denied') return 'denied';
        return 'default';
      } catch (err) {
        console.warn('Error requesting web notification permission:', err);
        return 'denied';
      }
    }

    // 2. React Native / Expo environment
    try {
      const getExpoNotifications = async (): Promise<any> => {
        try {
          return await (Function('return import("expo-notifications")')() as Promise<any>);
        } catch {
          return null;
        }
      };

      const Notifications = await getExpoNotifications();
      if (Notifications && Notifications.requestPermissionsAsync) {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        if (status === 'granted') return 'granted';
        if (status === 'denied') return 'denied';
        return 'provisional';
      }
    } catch {
      // expo-notifications not available
    }

    return 'unavailable';
  }
}

