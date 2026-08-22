import { doc, setDoc, updateDoc, serverTimestamp, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { UserDeviceRegistration, DevicePlatform, PushProvider } from '@saarathi/types';

export class DeviceRegistrationService {
  /**
   * Determine the current device platform.
   */
  public static detectPlatform(): DevicePlatform {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/android/i.test(ua)) return 'android';
      if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
      if (/windows/i.test(ua)) return 'windows';
      if (/macintosh|mac os x/i.test(ua)) return 'macos';
      return 'web';
    }
    return 'web';
  }

  /**
   * Get or generate a persistent local device ID for this client instance.
   */
  public static getOrCreateDeviceId(): string {
    const STORAGE_KEY = 'saarathi_device_id';
    try {
      if (typeof localStorage !== 'undefined') {
        let devId = localStorage.getItem(STORAGE_KEY);
        if (!devId) {
          devId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem(STORAGE_KEY, devId);
        }
        return devId;
      }
    } catch {}
    return `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Register or update a device registration in Firestore.
   */
  public static async registerDevice(
    userId: string,
    token: string,
    pushProvider: PushProvider,
    deviceName?: string
  ): Promise<UserDeviceRegistration> {
    const deviceId = this.getOrCreateDeviceId();
    const platform = this.detectPlatform();

    const deviceData: UserDeviceRegistration = {
      deviceId,
      userId,
      platform,
      token,
      pushProvider,
      appVersion: '1.0.0',
      deviceName: deviceName || (typeof navigator !== 'undefined' ? navigator.platform : 'Saarathi Client'),
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    try {
      const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
      await setDoc(
        deviceRef,
        {
          ...deviceData,
          updatedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to register device in Firestore (continuing locally):', err);
    }

    return deviceData;
  }

  /**
   * Update the last active timestamp of a device.
   */
  public static async pingDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
      await updateDoc(deviceRef, {
        lastSeenAt: serverTimestamp(),
      });
    } catch (err) {
      // Ignored
    }
  }

  /**
   * Get all registered devices for a user.
   */
  public static async getUserDevices(userId: string): Promise<UserDeviceRegistration[]> {
    try {
      const devicesRef = collection(db, 'users', userId, 'devices');
      const snap = await getDocs(devicesRef);
      return snap.docs.map((d) => d.data() as UserDeviceRegistration);
    } catch (err) {
      console.warn('Failed to fetch user devices:', err);
      return [];
    }
  }
}
