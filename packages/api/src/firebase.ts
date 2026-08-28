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

// Static environment variable resolution for Vite and React Native / Expo bundlers
const getFirebaseApiKey = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_FIREBASE_API_KEY) {
      return (import.meta as any).env.VITE_FIREBASE_API_KEY;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
    if (process.env.EXPO_PUBLIC_FIREBASE_API_KEY) return process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  }
  return 'AIzaSyB4tj4lMaEa-cW_8d9Tdodz4iy5JSOlHQA';
};

const getFirebaseAuthDomain = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN) {
      return (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_FIREBASE_AUTH_DOMAIN) return process.env.VITE_FIREBASE_AUTH_DOMAIN;
    if (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) return process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  }
  return 'saarathi-331b4.firebaseapp.com';
};

const getFirebaseProjectId = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID) {
      return (import.meta as any).env.VITE_FIREBASE_PROJECT_ID;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_FIREBASE_PROJECT_ID) return process.env.VITE_FIREBASE_PROJECT_ID;
    if (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) return process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  }
  return 'saarathi-331b4';
};

const getFirebaseStorageBucket = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET) {
      return (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_FIREBASE_STORAGE_BUCKET) return process.env.VITE_FIREBASE_STORAGE_BUCKET;
    if (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) return process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  }
  return 'saarathi-331b4.firebasestorage.app';
};

const getFirebaseMessagingSenderId = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) {
      return (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) return process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    if (process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) return process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  }
  return '404569610018';
};

const getFirebaseAppId = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_FIREBASE_APP_ID) {
      return (import.meta as any).env.VITE_FIREBASE_APP_ID;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_FIREBASE_APP_ID) return process.env.VITE_FIREBASE_APP_ID;
    if (process.env.EXPO_PUBLIC_FIREBASE_APP_ID) return process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  }
  return '1:404569610018:web:2f7d67bbb516202dd9b77b';
};

const firebaseConfig = {
  apiKey: getFirebaseApiKey(),
  authDomain: getFirebaseAuthDomain(),
  projectId: getFirebaseProjectId(),
  storageBucket: getFirebaseStorageBucket(),
  messagingSenderId: getFirebaseMessagingSenderId(),
  appId: getFirebaseAppId(),
  measurementId: 'G-YTY130STLF',
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
