import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { initialAnalytics } from '@saarathi/store';

// Stores & Contexts
import { useAuthStore } from '@saarathi/store';
import { useTaskStore } from '@saarathi/store';
import { useKairoStore } from '@saarathi/store';
import { useHabitGoalStore } from '@saarathi/store';
import { useNotificationStore } from '@saarathi/store';
import { useAnalyticsStore } from '@saarathi/store';
import { subscribeToAuthState } from '@saarathi/api';
import type { UserProfile } from '@saarathi/types';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider, useNavigation, isPublicView } from './context/NavigationContext';

// Layout Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { AuthModal } from './components/AuthModal';

// Views
import { AuthView } from './views/AuthView';
import { LandingPage } from './views/LandingPage';
import { DashboardView } from './views/DashboardView';
import { TodayView } from './views/TodayView';
import { CalendarView } from './views/CalendarView';
import { TaskBoardView } from './views/TaskBoardView';
import { AIChatView } from './views/AIChatView';
import { AnalyticsView } from './views/AnalyticsView';
import { BrainDumpView } from './views/BrainDumpView';
import { FocusModeView } from './views/FocusModeView';
import { HabitsEngineView } from './views/HabitsEngineView';
import { GoalsSystemView } from './views/GoalsSystemView';
import { SettingsView } from './views/SettingsView';
import { NotificationsProfileView } from './views/NotificationsProfileView';

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

  // 0. Bootstrap persistent auth session (so a refresh keeps the user logged in
  //    and the route guard reflects the real authentication state).
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      const { isAuthenticated: authed, login: doLogin, logout: doLogout } = useAuthStore.getState();
      if (user) {
        if (!authed) {
          doLogin({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
          });
        }
      } else {
        doLogout();
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


  // Security: Route guard. Any view that is not public requires authentication.
  // If an unauthenticated user navigates (incl. by editing the URL hash) to a
  // protected view, bounce them back to the landing page and prompt sign-in.
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
      setCurrentView('dashboard');
    }
  };

  const handleAuthSuccess = (updated?: Partial<UserProfile>) => {
    login(updated);
    toast.success('Welcome to Saarathi!');
    setCurrentView('dashboard');
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

  // 1. Landing Page Flow (Full Screen, Landing Header -> Auth Modal Popup -> Main Workspace)
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
        return <SettingsView userProfile={userProfile} onUpdateProfile={updateUserProfile} />;
      case 'notifications':
      case 'profile':
        return (
          <NotificationsProfileView
            notifications={notifications}
            userProfile={userProfile}
            onMarkRead={markAsRead}
            onClearAll={clearAll}
            onUpdateProfile={updateUserProfile}
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
        />

        {/* View Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {renderCurrentView()}
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
