import { create } from 'zustand';
import { UserProfile, UserSettings, AuthModalMode } from '@saarathi/types';

export const fallbackUserProfile: UserProfile = {
  id: '',
  name: 'Guest User',
  brandingName: 'Saarathi OS',
  email: '',
  phone: '',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  bio: 'AI Productivity Enthusiast',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  aiModel: 'hybrid-orchestrator',
  notificationsEnabled: true,
  autoRescheduleHighRisk: true,
  theme: 'dark',
};

export const fallbackUserSettings: UserSettings = {
  uid: '',
  theme: 'dark',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  notificationsEnabled: true,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  defaultPomodoroDuration: 25,
  autoRescheduleHighRisk: true,
  syncSettings: true,
};

interface AuthState {
  userProfile: UserProfile;
  userSettings: UserSettings;
  authModalMode: AuthModalMode;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuthModalMode: (mode: AuthModalMode) => void;
  setUserProfile: (profile: UserProfile) => void;
  setUserSettings: (settings: UserSettings) => void;
  updateUserProfile: (partial: Partial<UserProfile>) => void;
  updateUserSettings: (partial: Partial<UserSettings>) => void;
   login: (profile?: Partial<UserProfile>, settings?: Partial<UserSettings>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userProfile: fallbackUserProfile,
  userSettings: fallbackUserSettings,
  authModalMode: null,
  isAuthenticated: false,
  isLoading: true,

  setAuthModalMode: (mode) => set({ authModalMode: mode }),

  setUserProfile: (profile) => set({ userProfile: profile }),

  setUserSettings: (settings) => set({ userSettings: settings }),

  updateUserProfile: (partial) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...partial },
    })),

  updateUserSettings: (partial) =>
    set((state) => ({
      userSettings: { ...state.userSettings, ...partial },
    })),

  login: (profile, settings) =>
    set((state) => ({
      isAuthenticated: true,
      authModalMode: null,
      isLoading: false,
      userProfile: profile ? { ...state.userProfile, ...profile } : state.userProfile,
      userSettings: settings ? { ...state.userSettings, ...settings } : state.userSettings,
    })),

  logout: () =>
    set({
      isAuthenticated: false,
      isLoading: false,
      userProfile: fallbackUserProfile,
      userSettings: fallbackUserSettings,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
