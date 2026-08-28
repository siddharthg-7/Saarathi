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
  limit,
  startAfter,
  serverTimestamp,
  Unsubscribe,
  SnapshotMetadata,
  DocumentSnapshot,
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

// Helper to recursively strip undefined values because Firestore rejects undefined
function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        typeof (value as any).toMillis !== 'function'
      ) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// ================= REMINDERS =================

export async function createReminderDoc(userId: string, reminder: Reminder): Promise<void> {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminder.id);
  const data = cleanFirestoreData({
    ...reminder,
    userId,
    createdAt: reminder.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(reminderRef, data);
}

export async function updateReminderDoc(
  userId: string,
  reminderId: string,
  updates: Partial<Reminder>
): Promise<void> {
  const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
  const data = cleanFirestoreData({
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(reminderRef, data);
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
  const data = cleanFirestoreData({
    ...item,
    userId,
    createdAt: serverTimestamp(),
  });
  await setDoc(notifRef, data);
}

export async function updateNotificationDoc(
  userId: string,
  notificationId: string,
  updates: Partial<NotificationItem>
): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
  const data = cleanFirestoreData({
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(notifRef, data);
}

export async function deleteNotificationDoc(
  userId: string,
  notificationId: string
): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
  await deleteDoc(notifRef);
}

export interface PaginatedNotificationResult {
  notifications: NotificationItem[];
  lastVisibleDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationItem[], metadata?: SnapshotMetadata) => void,
  maxResults: number = 50
): Unsubscribe {
  const notifsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notifsRef, orderBy('timestamp', 'desc'), limit(maxResults));

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

/**
 * High-performance cursor-based pagination for historical notifications
 */
export async function fetchNotificationsPaginated(
  userId: string,
  pageSize: number = 30,
  lastVisibleDoc: DocumentSnapshot | null = null,
  unreadOnly: boolean = false
): Promise<PaginatedNotificationResult> {
  const notifsRef = collection(db, 'users', userId, 'notifications');
  let q = query(notifsRef);

  if (unreadOnly) {
    q = query(q, where('read', '==', false), orderBy('timestamp', 'desc'), limit(pageSize));
  } else {
    q = query(q, orderBy('timestamp', 'desc'), limit(pageSize));
  }

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  const snapshot = await getDocs(q);
  const notifications: NotificationItem[] = snapshot.docs.map((d) => ({
    ...(d.data() as NotificationItem),
    id: d.id,
  }));

  const nextLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    notifications,
    lastVisibleDoc: nextLastDoc,
    hasMore: snapshot.docs.length === pageSize,
  };
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
