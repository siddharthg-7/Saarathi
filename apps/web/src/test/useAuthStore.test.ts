import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, fallbackUserProfile, fallbackUserSettings } from '@saarathi/store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userProfile: fallbackUserProfile,
      userSettings: fallbackUserSettings,
      authModalMode: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('should initialize with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.authModalMode).toBeNull();
  });

  it('should set auth modal mode', () => {
    const { setAuthModalMode } = useAuthStore.getState();

    setAuthModalMode('register');
    expect(useAuthStore.getState().authModalMode).toBe('register');

    setAuthModalMode(null);
    expect(useAuthStore.getState().authModalMode).toBeNull();
  });

  it('should allow profile updates in store state', () => {
    const { updateUserProfile } = useAuthStore.getState();

    updateUserProfile({
      bio: 'Staff Productivity Engineer',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      autoRescheduleHighRisk: true,
    });

    const updatedProfile = useAuthStore.getState().userProfile;
    expect(updatedProfile?.bio).toBe('Staff Productivity Engineer');
    expect(updatedProfile?.workingHoursStart).toBe('09:00');
    expect(updatedProfile?.autoRescheduleHighRisk).toBe(true);
  });

  it('should reset auth state and modal mode upon logout', () => {
    const { login, logout, setAuthModalMode } = useAuthStore.getState();

    login({ id: 'usr_123', name: 'John Doe', email: 'john@example.com' });
    setAuthModalMode('signin');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().userProfile.email).toBe('john@example.com');

    logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.authModalMode).toBeNull();
    expect(state.userProfile.id).toBe('');
    expect(state.userProfile.name).toBe('Guest User');
    expect(state.userProfile.email).toBe('');
  });

  it('should persist auth state to localStorage upon login', () => {
    const { login } = useAuthStore.getState();
    login({ id: 'usr_persist_99', name: 'Persisted User', email: 'persist@saarathi.ai' });

    const rawStored = localStorage.getItem('saarathi-auth-storage');
    expect(rawStored).toBeTruthy();
    if (rawStored) {
      const parsed = JSON.parse(rawStored);
      expect(parsed.state.isAuthenticated).toBe(true);
      expect(parsed.state.userProfile.id).toBe('usr_persist_99');
      expect(parsed.state.userProfile.email).toBe('persist@saarathi.ai');
    }
  });
});

