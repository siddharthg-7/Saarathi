import { create } from 'zustand';
import {
  NotificationItem,
  Reminder,
  NotificationPreferences,
  NotificationPermissionStatus,
  SmartReminderRecommendation,
  Task,
  EnergyLevel,
} from '@saarathi/types';
import {
  NotificationService,
  subscribeToReminders,
  subscribeToNotifications,
  createNotificationDoc,
  updateNotificationDoc,
  deleteNotificationDoc,
  getNotificationPreferences,
  saveNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  SnoozeOption,
} from '@saarathi/api';
import { initialNotifications } from './data/initialData';

interface NotificationState {
  notifications: NotificationItem[];
  reminders: Reminder[];
  unreadCount: number;
  permissionStatus: NotificationPermissionStatus;
  preferences: NotificationPreferences;
  recommendations: SmartReminderRecommendation[];
  activeUid: string | null;
  isLoading: boolean;

  // Real-time Firestore sync & Lifecycle
  initNotificationListener: (uid: string) => () => void;
  requestPermission: () => Promise<NotificationPermissionStatus>;

  // Notification CRUD
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (
    item: Omit<NotificationItem, 'id' | 'read' | 'timestamp' | 'time'> & { time?: string }
  ) => Promise<void>;

  // Preferences
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;

  // Reminders & Task scheduling
  scheduleTaskReminder: (task: Task) => Promise<Reminder | null>;
  cancelTaskReminder: (taskId: string) => Promise<void>;
  snoozeReminder: (reminderId: string, option: SnoozeOption) => Promise<void>;

  // Smart Intelligence
  evaluateSmartRules: (tasks: Task[], userEnergy?: EnergyLevel) => void;
  acceptRecommendation: (
    recId: string,
    onApplyReschedule?: (taskId: string, newTime: string) => void
  ) => void;
  dismissRecommendation: (recId: string) => void;

  // Action execution (from Notification Card buttons)
  executeAction: (
    notificationId: string,
    actionId: string,
    onTaskComplete?: (taskId: string) => void
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: initialNotifications.map((n) => ({
    ...n,
    timestamp: Date.now(),
  })),
  reminders: [],
  unreadCount: initialNotifications.filter((n) => !n.read).length,
  permissionStatus: 'default',
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  recommendations: [],
  activeUid: null,
  isLoading: false,

  initNotificationListener: (uid: string) => {
    set({ activeUid: uid, isLoading: true });

    // Check initial permission status
    NotificationService.getPermissionStatus().then((status) => {
      set({ permissionStatus: status });
    });

    // Load preferences
    getNotificationPreferences(uid).then((prefs) => {
      set({ preferences: prefs });
    });

    // Subscribe to Firestore Reminders
    const unsubReminders = subscribeToReminders(uid, (firestoreReminders) => {
      set({ reminders: firestoreReminders });
    });

    // Subscribe to Firestore Notifications
    const unsubNotifications = subscribeToNotifications(uid, (firestoreNotifs) => {
      if (firestoreNotifs.length > 0) {
        const unread = firestoreNotifs.filter((n) => !n.read).length;
        set({ notifications: firestoreNotifs, unreadCount: unread, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    });

    // Subscribe to in-app local notification events
    const unsubInApp = NotificationService.onInAppNotification((item) => {
      const current = get().notifications;
      const updated = [item, ...current];
      set({
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      });

      // Persist to Firestore if authenticated
      if (uid) {
        createNotificationDoc(uid, item).catch(() => {});
      }
    });

    return () => {
      unsubReminders();
      unsubNotifications();
      unsubInApp();
    };
  },

  requestPermission: async () => {
    const status = await NotificationService.requestPermission();
    set({ permissionStatus: status });
    return status;
  },

  markAsRead: async (id: string) => {
    const { notifications, activeUid } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
    );
    const unread = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount: unread });

    if (activeUid) {
      await updateNotificationDoc(activeUid, id, {
        read: true,
        readAt: new Date().toISOString(),
      }).catch(() => {});
    }
  },

  markAllAsRead: async () => {
    const { notifications, activeUid } = get();
    const nowIso = new Date().toISOString();
    const updated = notifications.map((n) => ({ ...n, read: true, readAt: nowIso }));
    set({ notifications: updated, unreadCount: 0 });

    if (activeUid) {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) => updateNotificationDoc(activeUid, n.id, { read: true, readAt: nowIso }))
      ).catch(() => {});
    }
  },

  deleteNotification: async (id: string) => {
    const { notifications, activeUid } = get();
    const updated = notifications.filter((n) => n.id !== id);
    const unread = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount: unread });

    if (activeUid) {
      await deleteNotificationDoc(activeUid, id).catch(() => {});
    }
  },

  clearAll: async () => {
    const { notifications, activeUid } = get();
    set({ notifications: [], unreadCount: 0 });

    if (activeUid) {
      await Promise.all(
        notifications.map((n) => deleteNotificationDoc(activeUid, n.id))
      ).catch(() => {});
    }
  },

  addNotification: async (item) => {
    const { notifications, activeUid } = get();
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      read: false,
    };

    const updated = [newItem, ...notifications];
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });

    if (activeUid) {
      await createNotificationDoc(activeUid, newItem).catch(() => {});
    }
  },

  updatePreferences: async (updates: Partial<NotificationPreferences>) => {
    const { preferences, activeUid } = get();
    const newPreferences: NotificationPreferences = {
      ...preferences,
      ...updates,
      quietHours: {
        ...preferences.quietHours,
        ...(updates.quietHours || {}),
      },
    };

    set({ preferences: newPreferences });

    if (activeUid) {
      await saveNotificationPreferences(activeUid, newPreferences);
    }
  },

  scheduleTaskReminder: async (task: Task) => {
    const { activeUid, preferences } = get();
    return NotificationService.scheduleTaskReminder(task, activeUid || undefined, preferences);
  },

  cancelTaskReminder: async (taskId: string) => {
    const { activeUid } = get();
    await NotificationService.cancelTaskReminders(taskId, activeUid || undefined);
  },

  snoozeReminder: async (reminderId: string, option: SnoozeOption) => {
    const { reminders, preferences } = get();
    const target = reminders.find((r) => r.id === reminderId);
    if (!target) return;

    const { updatedReminder } = await NotificationService.snoozeReminder(
      target,
      option,
      preferences
    );

    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === reminderId ? updatedReminder : r)),
    }));
  },

  evaluateSmartRules: (tasks: Task[], userEnergy: EnergyLevel = 'Medium') => {
    const { reminders, preferences } = get();
    const result = NotificationService.evaluateSmartRules({
      tasks,
      reminders,
      preferences,
      userEnergy,
    });

    if (result.recommendations.length > 0) {
      set({ recommendations: result.recommendations });
    }

    if (result.notificationsToDispatch.length > 0) {
      result.notificationsToDispatch.forEach((notif) => {
        get().addNotification(notif);
      });
    }
  },

  acceptRecommendation: (recId, onApplyReschedule) => {
    const { recommendations } = get();
    const target = recommendations.find((r) => r.id === recId);
    if (target && onApplyReschedule) {
      onApplyReschedule(target.taskId, target.recommendedTime);
    }
    set({
      recommendations: recommendations.filter((r) => r.id !== recId),
    });
  },

  dismissRecommendation: (recId) => {
    set((state) => ({
      recommendations: state.recommendations.filter((r) => r.id !== recId),
    }));
  },

  executeAction: async (notificationId, actionId, onTaskComplete) => {
    const { notifications, reminders, preferences } = get();
    const targetNotif = notifications.find((n) => n.id === notificationId);
    if (!targetNotif) return;

    // 1. Mark notification read
    await get().markAsRead(notificationId);

    // 2. Action routing
    if (actionId === 'done' && targetNotif.taskId) {
      if (onTaskComplete) {
        onTaskComplete(targetNotif.taskId);
      }
      if (targetNotif.reminderId) {
        await NotificationService.markTaskRemindersCompleted(targetNotif.taskId, get().activeUid || undefined);
      }
    } else if (actionId.startsWith('snooze_')) {
      const minutes = parseInt(actionId.replace('snooze_', ''), 10) || 10;
      if (targetNotif.reminderId) {
        await get().snoozeReminder(targetNotif.reminderId, minutes as SnoozeOption);
      }
    }
  },
}));
