import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserSettings, UserDevice, UserSession } from '@saarathi/types';

// ================= USER PROFILE =================

export async function createUserProfileDoc(
  profile: Partial<UserProfile> & { id: string }
): Promise<void> {
  const userRef = doc(db, 'users', profile.id);
  const data = {
    uid: profile.id,
    email: profile.email || '',
    displayName: profile.name || '',
    brandingName: profile.brandingName || 'Saarathi OS',
    avatar: profile.avatar || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    createdAt: serverTimestamp(),
  };
  await setDoc(userRef, data, { merge: true });
}

export async function getUserProfileDoc(uid: string): Promise<Partial<UserProfile> | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as Partial<UserProfile>;
}

export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: Partial<UserProfile> | null) => void
): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Partial<UserProfile>);
    } else {
      callback(null);
    }
  });
}

// ================= USER SETTINGS =================

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'uid'> = {
  theme: 'dark',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  notificationsEnabled: true,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  defaultPomodoroDuration: 25,
  autoRescheduleHighRisk: true,
  syncSettings: true,
};

export async function createUserSettingsDoc(
  uid: string,
  settings?: Partial<UserSettings>
): Promise<UserSettings> {
  const settingsRef = doc(db, 'settings', uid);
  const fullSettings: UserSettings = {
    uid,
    ...DEFAULT_USER_SETTINGS,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(settingsRef, fullSettings, { merge: true });
  return fullSettings;
}

export async function getUserSettingsDoc(uid: string): Promise<UserSettings | null> {
  const settingsRef = doc(db, 'settings', uid);
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) return null;
  return snap.data() as UserSettings;
}

export async function updateUserSettingsDoc(
  uid: string,
  updates: Partial<UserSettings>
): Promise<void> {
  const settingsRef = doc(db, 'settings', uid);
  await updateDoc(settingsRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeToUserSettings(
  uid: string,
  callback: (settings: UserSettings | null) => void
): Unsubscribe {
  const settingsRef = doc(db, 'settings', uid);
  return onSnapshot(settingsRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserSettings);
    } else {
      callback(null);
    }
  });
}

// ================= USER DEVICES =================

export async function registerUserDevice(
  uid: string,
  device: Omit<UserDevice, 'id' | 'uid' | 'createdAt' | 'lastActiveAt'>
): Promise<UserDevice> {
  const deviceRef = doc(collection(db, 'devices', uid, 'user_devices'), device.deviceId);
  const deviceData: UserDevice = {
    id: device.deviceId,
    uid,
    ...device,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  await setDoc(deviceRef, deviceData, { merge: true });
  return deviceData;
}

export async function updateDeviceLastActive(uid: string, deviceId: string): Promise<void> {
  const deviceRef = doc(db, 'devices', uid, 'user_devices', deviceId);
  await updateDoc(deviceRef, { lastActiveAt: new Date().toISOString() });
}

// ================= USER SESSIONS =================

export async function createSessionDoc(
  uid: string,
  sessionInfo?: Partial<UserSession>
): Promise<UserSession> {
  const sessionRef = doc(collection(db, 'sessions', uid, 'user_sessions'));
  const sessionData: UserSession = {
    id: sessionRef.id,
    uid,
    startedAt: new Date().toISOString(),
    lastPingAt: new Date().toISOString(),
    ipAddress: sessionInfo?.ipAddress || '',
    userAgent:
      sessionInfo?.userAgent ||
      (typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile App'),
    active: true,
  };
  await setDoc(sessionRef, sessionData);
  return sessionData;
}

export async function closeSessionDoc(uid: string, sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'sessions', uid, 'user_sessions', sessionId);
  await updateDoc(sessionRef, { active: false, lastPingAt: new Date().toISOString() });
}
