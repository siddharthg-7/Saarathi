import { useEffect } from 'react';
import { useAuthStore } from '@saarathi/store';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogleCredential,
  signOutUser,
  subscribeToAuthState,
  subscribeToUserProfile,
  subscribeToUserSettings,
  createUserProfileDoc,
  createUserSettingsDoc,
  registerUserDevice,
  createSessionDoc,
  closeSessionDoc,
  User,
} from '@saarathi/api';
import { UserProfile, UserSettings } from '@saarathi/types';

export function useAuth() {
  const {
    userProfile,
    userSettings,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUserProfile,
    updateUserSettings,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;
    let currentSessionId: string | null = null;

    const unsubscribeAuth = subscribeToAuthState(async (user: User | null) => {
      if (!user) {
        if (unsubscribeProfile) unsubscribeProfile();
        if (unsubscribeSettings) unsubscribeSettings();
        logout();
        setLoading(false);
        return;
      }

      setLoading(true);

      // Subscribe to user profile changes
      unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
        if (profile) {
          updateUserProfile(profile);
        }
      });

      // Subscribe to user settings changes
      unsubscribeSettings = subscribeToUserSettings(user.uid, (settings) => {
        if (settings) {
          updateUserSettings(settings);
        }
      });

      // Register active device & session
      try {
        await registerUserDevice(user.uid, {
          deviceId: 'mobile-app',
          deviceModel: 'Expo React Native Device',
          os: 'android',
        });
        const session = await createSessionDoc(user.uid);
        currentSessionId = session.id;
      } catch (err) {
        console.warn('Device/Session registration warning:', err);
      }

      login(
        {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'User',
        },
        { uid: user.uid }
      );
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeSettings) unsubscribeSettings();
      if (currentSessionId && userProfile.id) {
        closeSessionDoc(userProfile.id, currentSessionId).catch(() => {});
      }
    };
  }, []);

  const handleSignUp = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, pass, name);
      await createUserProfileDoc({ id: user.uid, email, name: name || '' });
      await createUserSettingsDoc(user.uid);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      return await signInWithEmail(email, pass);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string, accessToken?: string) => {
    setLoading(true);
    try {
      const user = await signInWithGoogleCredential(idToken, accessToken);
      await createUserProfileDoc({ id: user.uid, email: user.email || '', name: user.displayName || '' });
      await createUserSettingsDoc(user.uid);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      logout();
    } finally {
      setLoading(false);
    }
  };

  return {
    userProfile,
    userSettings,
    isAuthenticated,
    isLoading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    googleSignIn: handleGoogleSignIn,
    signOut: handleSignOut,
  };
}
