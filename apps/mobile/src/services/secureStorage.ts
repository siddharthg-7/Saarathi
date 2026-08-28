/**
 * Mobile Secure Storage Service
 * Enforces secure storage for sensitive credentials, auth tokens, and session keys
 * on React Native / Expo platforms rather than unencrypted AsyncStorage.
 */

// In-memory fallback if platform secure store native module is not linked
const memoryStore: Record<string, string> = {};

export interface SecureStorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

class SecureStorageService implements SecureStorageInterface {
  private secureStoreModule: any = null;

  constructor() {
    try {
      // Dynamic import to support Expo SecureStore when available
      this.secureStoreModule = require('expo-secure-store');
    } catch {
      this.secureStoreModule = null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.secureStoreModule?.getItemAsync) {
        return await this.secureStoreModule.getItemAsync(key);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Error reading key ${key}:`, e);
    }
    return memoryStore[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.secureStoreModule?.setItemAsync) {
        await this.secureStoreModule.setItemAsync(key, value, {
          keychainAccessible: this.secureStoreModule.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        return;
      }
    } catch (e) {
      console.warn(`[SecureStorage] Error writing key ${key}:`, e);
    }
    memoryStore[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.secureStoreModule?.deleteItemAsync) {
        await this.secureStoreModule.deleteItemAsync(key);
        return;
      }
    } catch (e) {
      console.warn(`[SecureStorage] Error deleting key ${key}:`, e);
    }
    delete memoryStore[key];
  }
}

export const secureStorage = new SecureStorageService();
