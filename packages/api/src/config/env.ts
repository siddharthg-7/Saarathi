export interface AppEnv {
  apiBaseUrl: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  appName: string;
  enableMockFallback: boolean;
}

// Resilient env loader that works in both Vite (import.meta.env) and Expo (process.env)
const getEnvVar = (key: string, fallback: string): string => {
  // 1. Try Vite import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key] !== undefined) {
      return (import.meta as any).env[key];
    }
  } catch {}

  // 2. Try Expo / Node process.env (mapping VITE_ keys to EXPO_PUBLIC_ keys)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const expoKey = key.replace('VITE_', 'EXPO_PUBLIC_');
      if (process.env[expoKey] !== undefined) {
        return process.env[expoKey] as string;
      }
      if (process.env[key] !== undefined) {
        return process.env[key] as string;
      }
    }
  } catch {}

  return fallback;
};

export const env: AppEnv = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/v1'),
  firebaseApiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'AIzaSyB4tj4lMaEa-cW_8d9Tdodz4iy5JSOlHQA'),
  firebaseAuthDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'saarathi-331b4.firebaseapp.com'),
  firebaseProjectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'saarathi-331b4'),
  appName: getEnvVar('VITE_APP_NAME', 'Saarathi OS'),
  enableMockFallback: getEnvVar('VITE_ENABLE_MOCK_FALLBACK', 'true') !== 'false',
};

