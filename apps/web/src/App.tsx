import React, { useState } from 'react';
import { initialAnalytics } from './data/initialData';

// Stores & Contexts
import { useAuthStore } from '@saarathi/store';
import { useTaskStore } from '@saarathi/store';
import { useKairoStore } from '@saarathi/store';
import { useHabitGoalStore } from '@saarathi/store';
import { useNotificationStore } from '@saarathi/store';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';

// Layout Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { AuthModal } from './components/AuthModal';

// Views
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
  const { currentView, setCurrentView } = useNavigation();

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

  // Local state for modals & sidebar
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleEnterWorkspace = () => {
    if (!isAuthenticated) {
      setAuthModalMode('signin');
    } else {
      setCurrentView('dashboard');
    }
  };

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
          onSuccess={(updated) => {
            login(updated);
            setCurrentView('dashboard');
          }}
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
        return <AnalyticsView analytics={initialAnalytics} />;
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
        onSuccess={(updated) => {
          login(updated);
          setCurrentView('dashboard');
        }}
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
