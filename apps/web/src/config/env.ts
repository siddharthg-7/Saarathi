export interface AppEnv {
  apiBaseUrl: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  appName: string;
  enableMockFallback: boolean;
}

export const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1',
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'saarathi-os.firebaseapp.com',
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'saarathi-os',
  appName: import.meta.env.VITE_APP_NAME || 'Saarathi OS',
  enableMockFallback: import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false',
};
