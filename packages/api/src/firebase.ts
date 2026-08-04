import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[`EXPO_PUBLIC_${key}`]) return process.env[`EXPO_PUBLIC_${key}`] as string;
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`] as string;
    if (process.env[key]) return process.env[key] as string;
  }
  try {
    const metaObj = (new Function('return import.meta'))();
    const metaEnv = metaObj ? metaObj.env : null;
    if (metaEnv) {
      if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
      if (metaEnv[`EXPO_PUBLIC_${key}`]) return metaEnv[`EXPO_PUBLIC_${key}`];
    }
  } catch {}
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY') || 'dummy-api-key',
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') || 'dummy-auth-domain',
  projectId: getEnvVar('FIREBASE_PROJECT_ID') || 'dummy-project-id',
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET') || 'dummy-storage-bucket',
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || 'dummy-sender-id',
  appId: getEnvVar('FIREBASE_APP_ID') || 'dummy-app-id',
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID') || 'dummy-measurement-id',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };
