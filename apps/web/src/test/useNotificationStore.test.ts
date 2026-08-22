import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '@saarathi/store';
import { NotificationItem } from '@saarathi/types';

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      reminders: [],
      unreadCount: 0,
      recommendations: [],
    });
  });

  it('should add notification and compute unreadCount', async () => {
    await useNotificationStore.getState().addNotification({
      title: 'New Task Alert',
      message: 'Time to study DSA',
      type: 'task_reminder',
      taskId: 'task_dsa',
    });

    const notifs = useNotificationStore.getState().notifications;
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe('New Task Alert');
    expect(notifs[0].read).toBe(false);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('should mark single notification as read', async () => {
    await useNotificationStore.getState().addNotification({
      title: 'Reminder 1',
      message: 'Message 1',
      type: 'task_reminder',
    });

    const notifId = useNotificationStore.getState().notifications[0].id;
    await useNotificationStore.getState().markAsRead(notifId);

    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('should mark all notifications as read', async () => {
    await useNotificationStore.getState().addNotification({
      title: 'Notif 1',
      message: 'Msg 1',
      type: 'task_reminder',
    });
    await useNotificationStore.getState().addNotification({
      title: 'Notif 2',
      message: 'Msg 2',
      type: 'ai_insight',
    });

    expect(useNotificationStore.getState().unreadCount).toBe(2);

    await useNotificationStore.getState().markAllAsRead();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications.every((n) => n.read)).toBe(true);
  });

  it('should update preferences properly', async () => {
    await useNotificationStore.getState().updatePreferences({
      soundEnabled: false,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '06:00',
      },
    });

    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.soundEnabled).toBe(false);
    expect(prefs.quietHours.start).toBe('22:00');
    expect(prefs.quietHours.end).toBe('06:00');
  });

  it('should delete a notification from state', async () => {
    await useNotificationStore.getState().addNotification({
      title: 'To Delete',
      message: 'Msg',
      type: 'system',
    });

    const id = useNotificationStore.getState().notifications[0].id;
    await useNotificationStore.getState().deleteNotification(id);

    expect(useNotificationStore.getState().notifications.length).toBe(0);
  });
});
