import { create } from 'zustand';
import { UserProfile, AuthModalMode } from '@saarathi/types';
import { initialUserProfile } from '@/data/initialData';

interface AuthState {
  userProfile: UserProfile;
  authModalMode: AuthModalMode;
  isAuthenticated: boolean;
  setAuthModalMode: (mode: AuthModalMode) => void;
  updateUserProfile: (partial: Partial<UserProfile>) => void;
  login: (profile?: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userProfile: initialUserProfile,
  authModalMode: null,
  isAuthenticated: true,

  setAuthModalMode: (mode) => set({ authModalMode: mode }),

  updateUserProfile: (partial) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...partial },
    })),

  login: (profile) =>
    set((state) => ({
      isAuthenticated: true,
      authModalMode: null,
      userProfile: profile ? { ...state.userProfile, ...profile } : state.userProfile,
    })),

  logout: () => set({ isAuthenticated: false }),
}));
