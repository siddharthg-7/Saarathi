import React from 'react';
import { Sparkles, Search, Mic, Bell, Menu, User, ShieldCheck, Bot, LogOut } from 'lucide-react';
import { ViewType, UserProfile, AuthModalMode } from '@saarathi/types';

interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  userProfile: UserProfile;
  unreadNotificationsCount: number;
  onOpenCommandPalette: () => void;
  onOpenAuth: (mode: AuthModalMode) => void;
  onToggleSidebarMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  userProfile,
  unreadNotificationsCount,
  onOpenCommandPalette,
  onOpenAuth,
  onToggleSidebarMobile,
}) => {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const viewTitles: Record<ViewType, string> = {
    landing: 'Saarathi OS — Overview',
    dashboard: 'Home Dashboard',
    today: "Today's Schedule",
    calendar: 'Calendar & Timeblocks',
    tasks: 'Task Board',
    aichat: 'Kairo AI Assistant',
    braindump: 'Voice Brain Dump',
    focus: 'Focus Mode (Pomodoro)',
    analytics: 'Productivity Analytics',
    habits: 'Habits Engine & Streaks',
    goals: 'Goals & Milestones',
    settings: 'System Settings',
    notifications: 'Notifications & Alerts',
    profile: 'User Profile',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/75 backdrop-blur-md border-b border-divider px-4 sm:px-6 flex items-center justify-between shadow-sm-premium">
      {/* Left: Mobile Menu Toggle & Brand / View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-textSecondary hover:text-text hover:bg-surfaceSecondary rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img
              src="/logo.png"
              alt="Saarathi Logo"
              className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-base tracking-tight text-text hidden sm:inline-block">
              Saarathi <span className="text-primary font-normal">OS</span>
            </span>
          </div>

          <span className="text-border hidden sm:inline-block">/</span>

          <span className="text-xs font-semibold text-textSecondary bg-surfaceSecondary px-3 py-1 rounded-full border border-border">
            {viewTitles[currentView]}
          </span>
        </div>
      </div>

      {/* Middle: Kairo Status Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#EFF6FF] border border-primary/10 rounded-full text-xs text-primary font-medium">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <Bot className="w-3.5 h-3.5 text-primary" />
        <span>Kairo AI • Context Aware</span>
      </div>

      {/* Right: Search, Voice Dump, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-surfaceSecondary hover:bg-surfaceHover text-textSecondary hover:text-text border border-border rounded-xl text-xs transition-all"
        >
          <Search className="w-3.5 h-3.5 text-primary" />
          <span className="hidden md:inline">Search or ask Kairo...</span>
          <kbd className="hidden md:inline-block text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-muted font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Quick Voice Brain Dump Button */}
        <button
          onClick={() => onSelectView('braindump')}
          title="Voice Brain Dump"
          className="p-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-primary border border-primary/20 rounded-xl transition-all"
        >
          <Mic className="w-4 h-4 animate-pulse" />
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => onSelectView('notifications')}
          className="relative p-2 text-textSecondary hover:text-text hover:bg-surfaceSecondary rounded-xl border border-transparent hover:border-border transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-surface animate-ping" />
          )}
        </button>

        {/* Profile Avatar / Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-surfaceSecondary transition-colors focus:outline-none"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/20"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-large-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 border-b border-divider mb-1">
                <div className="font-semibold text-xs text-text">{userProfile.name}</div>
                <div className="text-[11px] text-textSecondary truncate">{userProfile.email}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                  <ShieldCheck className="w-3 h-3 text-success" />
                  <span>Verified Saarathi Pro</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectView('notifications');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-textSecondary hover:text-text hover:bg-surfaceSecondary rounded-lg flex items-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Profile & Settings</span>
              </button>

              <button
                onClick={() => {
                  onOpenAuth('signin');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-danger hover:bg-danger/10 rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch / Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
