import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { MobileNotificationHandler } from '../src/services/mobileNotificationHandler';
import { useTaskStore, useNotificationStore } from '@saarathi/store';

function AuthProtector({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, userProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 1. Navigation Auth Guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/landing');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  // 2. Initialize Mobile Notification System & Task Firestore Sync
  useEffect(() => {
    let unsubNotifications: (() => void) | undefined;
    let unsubTasks: (() => void) | undefined;
    let unsubNotifStore: (() => void) | undefined;

    MobileNotificationHandler.init((taskId) => {
      router.push('/(tabs)/tasks');
    }).then((unsub) => {
      unsubNotifications = unsub;
    });

    if (isAuthenticated && userProfile?.id) {
      unsubTasks = useTaskStore.getState().initTaskListener(userProfile.id);
      unsubNotifStore = useNotificationStore.getState().initNotificationListener(userProfile.id);
    }

    return () => {
      if (unsubNotifications) unsubNotifications();
      if (unsubTasks) unsubTasks();
      if (unsubNotifStore) unsubNotifStore();
    };
  }, [isAuthenticated, userProfile?.id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProtector>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="focus" options={{ headerShown: false }} />
      </Stack>
    </AuthProtector>
  );
}
