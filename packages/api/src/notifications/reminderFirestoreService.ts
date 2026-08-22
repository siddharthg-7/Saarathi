import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Unsubscribe,
  SnapshotMetadata,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Reminder, NotificationItem, NotificationPreferences } from '@saarathi/types';

// Default user notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  globalNotificationEnabled: true,
  taskReminderEnabled: true,
  smartReminderEnabled: true,
  dailyBriefEnabled: true,
  habitReminderEnabled: true,
  focusReminderEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: true,
    start: '23:00',
    end: '07:00',
  },
  snoozeDefaults: [10, 30, 60],
  showSensitiveDetails: true,
};

// ================= REMINDERS =================

export async function createReminderDoc(userId: string, reminder: Reminder): Promise<void> {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminder.id);
  await setDoc(reminderRef, {
    ...reminder,
    userId,
    createdAt: reminder.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateReminderDoc(
  userId: string,
  reminderId: string,
  updates: Partial<Reminder>
): Promise<void> {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
  await updateDoc(reminderRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReminderDoc(userId: string, reminderId: string): Promise<void> {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
  await deleteDoc(reminderRef);
}

export async function getRemindersForTask(userId: string, taskId: string): Promise<Reminder[]> {
  try {
    const remindersRef = collection(db, 'users', userId, 'reminders');
    const q = query(remindersRef, where('taskId', '==', taskId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...(d.data() as Reminder),
      id: d.id,
    }));
  } catch (err) {
    console.warn('Error fetching reminders for task:', err);
    return [];
  }
}

export function subscribeToReminders(
  userId: string,
  callback: (reminders: Reminder[], metadata?: SnapshotMetadata) => void
): Unsubscribe {
  const remindersRef = collection(db, 'users', userId, 'reminders');
  const q = query(remindersRef, orderBy('scheduledAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const reminders: Reminder[] = snapshot.docs.map((d) => ({
        ...(d.data() as Reminder),
        id: d.id,
      }));
      callback(reminders, snapshot.metadata);
    },
    (error) => {
      console.warn('Reminders subscription error (continuing with local state):', error);
    }
  );
}

// ================= NOTIFICATIONS (NOTIFICATION CENTER) =================

export async function createNotificationDoc(
  userId: string,
  item: NotificationItem
): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', item.id);
  await setDoc(notifRef, {
    ...item,
    userId,
    createdAt: serverTimestamp(),
  });
}

export async function updateNotificationDoc(
  userId: string,
  notificationId: string,
  updates: Partial<NotificationItem>
): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(notifRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotificationDoc(
  userId: string,
  notificationId: string
): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
  await deleteDoc(notifRef);
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationItem[], metadata?: SnapshotMetadata) => void
): Unsubscribe {
  const notifsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notifsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: NotificationItem[] = snapshot.docs.map((d) => ({
        ...(d.data() as NotificationItem),
        id: d.id,
      }));
      callback(notifications, snapshot.metadata);
    },
    (error) => {
      console.warn('Notifications subscription error:', error);
    }
  );
}

// ================= PREFERENCES =================

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    const prefRef = doc(db, 'settings', userId);
    const snap = await getDoc(prefRef);
    if (snap.exists() && snap.data().notificationPreferences) {
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...snap.data().notificationPreferences,
      };
    }
  } catch (err) {
    console.warn('Failed to load notification preferences from Firestore:', err);
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const prefRef = doc(db, 'settings', userId);
    await setDoc(
      prefRef,
      {
        notificationPreferences: preferences,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to persist notification preferences:', err);
  }
}
