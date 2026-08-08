import { create } from 'zustand';
import { NotificationItem } from '@saarathi/types';
import { initialNotifications } from './data/initialData';

interface NotificationState {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  clearAll: () => set({ notifications: [] }),

  addNotification: (item) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}`,
      read: false,
    };
    set((state) => ({ notifications: [newItem, ...state.notifications] }));
  },
}));
