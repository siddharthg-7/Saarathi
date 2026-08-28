import React, { useEffect, useState, lazy, Suspense } from 'react';
import { toast } from 'react-toastify';
import { initialAnalytics } from '@saarathi/store';

import { useAuthStore } from '@saarathi/store';
import { useTaskStore } from '@saarathi/store';
import { useKairoStore } from '@saarathi/store';
import { useHabitGoalStore } from '@saarathi/store';
import { useNotificationStore } from '@saarathi/store';
import { useAnalyticsStore } from '@saarathi/store';
import { useMLStore } from '@saarathi/store';
import { useMemoryStore } from '@saarathi/store';
import { useXAIStore } from '@saarathi/store';
import { subscribeToAuthState, signOutUser } from '@saarathi/api';
import type { UserProfile } from '@saarathi/types';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider, useNavigation, isPublicView } from './context/NavigationContext';

// Layout Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { AuthModal } from './components/AuthModal';
import { KairoAssistantWidget } from './components/kairo/KairoAssistantWidget';

// Core Critical-Path Views (Eagerly Loaded)
import { AuthView } from './views/AuthView';
import { LandingPage } from './views/LandingPage';
import { DashboardView } from './views/DashboardView';
import { TodayView } from './views/TodayView';

// Secondary / Heavy Views (Dynamically Code-Split via React.lazy)
const CalendarView = lazy(() => import('./views/CalendarView').then(m => ({ default: m.CalendarView })));
const TaskBoardView = lazy(() => import('./views/TaskBoardView').then(m => ({ default: m.TaskBoardView })));
const AIChatView = lazy(() => import('./views/AIChatView').then(m => ({ default: m.AIChatView })));
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const BrainDumpView = lazy(() => import('./views/BrainDumpView').then(m => ({ default: m.BrainDumpView })));
const FocusModeView = lazy(() => import('./views/FocusModeView').then(m => ({ default: m.FocusModeView })));
const HabitsEngineView = lazy(() => import('./views/HabitsEngineView').then(m => ({ default: m.HabitsEngineView })));
const GoalsSystemView = lazy(() => import('./views/GoalsSystemView').then(m => ({ default: m.GoalsSystemView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const NotificationsProfileView = lazy(() => import('./views/NotificationsProfileView').then(m => ({ default: m.NotificationsProfileView })));

// Sleek Suspense Fallback Loader
const ViewLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[350px] w-full" data-testid="view-loader">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <span className="text-xs text-text-muted font-medium animate-pulse">Loading view...</span>
    </div>
  </div>
);

function AppContent() {
  const { currentView, setCurrentView, navigate } = useNavigation();

  // Auth Store
  const { userProfile, authModalMode, setAuthModalMode, updateUserProfile, isAuthenticated, login, logout } =
    useAuthStore();

  // Task Store
  const { tasks, addTask, toggleTaskComplete, postponeTask, updateTaskStatus, deleteTask } =
    useTaskStore();

  // Kairo Chat Store
  const { chatHistory, sendMessage } = useKairoStore();

  // Habit & Goal Store
  const { habits, goals, toggleHabitDay, addHabit, addGoal } = useHabitGoalStore();

  // Notification Store
  const { notifications, markAsRead, clearAll } = useNotificationStore();

  // Analytics Store
  const {
    analyticsData,
    timeRange,
    setTimeRange,
    logMoodAndEnergy,
    flushTelemetryQueue,
    queueStatus,
    refreshAnalytics,
  } = useAnalyticsStore();

  // Local state for modals & sidebar
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 0. Sync auth state from Firebase when available
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      if (firebaseUser) {
        const { userProfile: currentProfile, login: doLogin } = useAuthStore.getState();
        doLogin({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || currentProfile.name || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || currentProfile.email || '',
        });
      }
    });
    return unsubscribe;
  }, []);

  // 1. Initialize real-time Firestore listeners for Tasks, Goals, Notifications, and Analytics when authenticated
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.id) return;
    const unsubTasks = useTaskStore.getState().initTaskListener(userProfile.id);
    const unsubGoals = useHabitGoalStore.getState().initGoalListener(userProfile.id);
    const unsubNotifications = useNotificationStore.getState().initNotificationListener(userProfile.id);
    const unsubAnalytics = useAnalyticsStore.getState().initAnalyticsListener(userProfile.id);
    return () => {
      unsubTasks();
      unsubGoals();
      unsubNotifications();
      unsubAnalytics();
    };
  }, [isAuthenticated, userProfile?.id]);

  // 2. Refresh analytics matrix when tasks or habits change
  useEffect(() => {
    if (tasks.length > 0 || habits.length > 0) {
      refreshAnalytics(tasks, notifications as any, habits);
    }
  }, [tasks, habits, notifications, refreshAnalytics]);

  // 3. Evaluate Kairo smart reminder recommendations when tasks change
  useEffect(() => {
    if (isAuthenticated && tasks.length > 0) {
      useNotificationStore.getState().evaluateSmartRules(tasks);
    }
  }, [isAuthenticated, tasks]);

  // Security: Route guard for protected views
  useEffect(() => {
    if (!isPublicView(currentView) && !isAuthenticated) {
      setAuthModalMode('signin');
      toast.error('Please sign in to access that page.');
      navigate('landing');
    }
  }, [currentView, isAuthenticated, navigate, setAuthModalMode]);

  const handleEnterWorkspace = () => {
    if (!isAuthenticated) {
      setAuthModalMode('signin');
    } else {
      navigate('dashboard');
    }
  };

  const handleAuthSuccess = (updated?: Partial<UserProfile>) => {
    login(updated);
    setAuthModalMode(null);
    toast.success('Welcome to Saarathi!');
    navigate('dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out error:', e);
    }

    // 1. Reset auth state
    logout();

    // 2. Clear all user data from stores to prevent any state leakage
    useTaskStore.getState().reset();
    useHabitGoalStore.getState().reset();
    useKairoStore.getState().clearHistory();
    useNotificationStore.getState().reset();
    useAnalyticsStore.getState().reset();
    useMLStore.getState().reset();
    useMemoryStore.getState().reset();
    useXAIStore.getState().invalidateCache();

    // 3. Clear local/session cache
    try {
      localStorage.removeItem('saarathi-memory-storage');
      localStorage.removeItem('saarathi-auth-storage');
      sessionStorage.clear();
    } catch {}

    // 4. Ensure modals are closed and redirect to public landing page
    setAuthModalMode(null);
    navigate('landing');
    toast.info('Signed out successfully.');
  };

  // Full Screen Standalone Auth View
  if (currentView === 'auth') {
    return (
      <AuthView
        initialMode={authModalMode || 'signin'}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // 1. Landing Page Flow
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/20 selection:text-primary">
        <LandingPage
          onOpenAuth={(mode) => setAuthModalMode(mode)}
          onEnterWorkspace={handleEnterWorkspace}
          onSelectView={(v) => setCurrentView(v)}
        />

        {/* Auth Modal Popup */}
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // 2. Main Workspace Layout (Navbar + Sidebar + Main App Page Views)
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            userProfile={userProfile}
            tasks={tasks}
            onSelectView={(v) => setCurrentView(v)}
            onToggleTaskComplete={toggleTaskComplete}
            onPostponeTask={postponeTask}
          />
        );
      case 'today':
        return (
          <TodayView
            tasks={tasks}
            onToggleTaskComplete={toggleTaskComplete}
            onPostponeTask={postponeTask}
            onAddTask={addTask}
            onSelectView={(v) => setCurrentView(v)}
          />
        );
      case 'calendar':
        return <CalendarView tasks={tasks} onAddTask={addTask} />;
      case 'tasks':
        return (
          <TaskBoardView
            tasks={tasks}
            onToggleTaskComplete={toggleTaskComplete}
            onPostponeTask={postponeTask}
            onUpdateTaskStatus={updateTaskStatus}
            onDeleteTask={deleteTask}
            onSelectView={(v) => setCurrentView(v)}
          />
        );
      case 'aichat':
        return (
          <AIChatView
            tasks={tasks}
            chatHistory={chatHistory}
            onSendMessage={(msg) =>
              sendMessage(msg, {
                tasksCount: tasks.length,
                pendingTasks: tasks.filter((t) => t.status !== 'completed').map((t) => t.title),
                userProfileName: userProfile.name,
              })
            }
            onSelectView={(v) => setCurrentView(v)}
            onPostponeTask={postponeTask}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            analytics={analyticsData}
            timeRange={timeRange}
            onSelectTimeRange={setTimeRange}
            onLogMoodEnergy={logMoodAndEnergy}
            onFlushQueue={flushTelemetryQueue}
            queueStatus={queueStatus}
          />
        );
      case 'braindump':
        return <BrainDumpView onAddTask={addTask} />;
      case 'focus':
        return <FocusModeView tasks={tasks} onToggleTaskComplete={toggleTaskComplete} />;
      case 'habits':
        return (
          <HabitsEngineView
            habits={habits}
            onToggleHabitDay={toggleHabitDay}
            onAddHabit={addHabit}
          />
        );
      case 'goals':
        return <GoalsSystemView goals={goals} onAddGoal={addGoal} />;
      case 'settings':
        return (
          <SettingsView
            userProfile={userProfile}
            onUpdateProfile={updateUserProfile}
            onLogout={handleLogout}
          />
        );
      case 'notifications':
      case 'profile':
        return (
          <NotificationsProfileView
            notifications={notifications}
            userProfile={userProfile}
            onMarkRead={markAsRead}
            onClearAll={clearAll}
            onUpdateProfile={updateUserProfile}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <DashboardView
            userProfile={userProfile}
            tasks={tasks}
            onSelectView={(v) => setCurrentView(v)}
            onToggleTaskComplete={toggleTaskComplete}
            onPostponeTask={postponeTask}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        userProfile={userProfile}
        unreadNotificationsCount={unreadCount}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onToggleSidebarMobile={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        onLogout={handleLogout}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isOpenMobile={sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)}
          unreadNotificationsCount={unreadCount}
          onLogout={handleLogout}
        />

        {/* View Main Content Container with Suspense for Lazy-Loaded Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          <Suspense fallback={<ViewLoadingFallback />}>
            {renderCurrentView()}
          </Suspense>
        </main>
      </div>

      {/* Command Palette (`Cmd+K`) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectView={(v) => setCurrentView(v)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onQuickTaskCreate={(title) => addTask(title, 'Coding', 'Medium')}
      />

      {/* Auth Modals */}
      <AuthModal
        mode={authModalMode}
        onClose={() => setAuthModalMode(null)}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Kairo Floating Assistant */}
      {isAuthenticated && (
        <KairoAssistantWidget
          tasks={tasks}
          onSelectView={(v) => setCurrentView(v)}
          onPostponeTask={postponeTask}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </ThemeProvider>
  );
}
