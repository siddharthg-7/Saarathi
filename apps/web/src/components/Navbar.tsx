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
    <header className="sticky top-0 z-30 h-16 bg-gray-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Brand / View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <span className="font-bold text-base tracking-tight text-white hidden sm:inline-block">
              Saarathi <span className="text-indigo-400 font-normal">OS</span>
            </span>
          </div>

          <span className="text-gray-600 hidden sm:inline-block">/</span>

          <span className="text-xs font-semibold text-gray-200 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {viewTitles[currentView]}
          </span>
        </div>
      </div>

      {/* Middle: Kairo Status Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Bot className="w-3.5 h-3.5 text-indigo-400" />
        <span>Kairo AI • Context Aware</span>
      </div>

      {/* Right: Search, Voice Dump, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-white/10 rounded-xl text-xs transition-all"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Search or ask Kairo...</span>
          <kbd className="hidden md:inline-block text-[10px] bg-gray-950 px-1.5 py-0.5 rounded border border-white/10 text-gray-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Quick Voice Brain Dump Button */}
        <button
          onClick={() => onSelectView('braindump')}
          title="Voice Brain Dump"
          className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all"
        >
          <Mic className="w-4 h-4 animate-pulse" />
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => onSelectView('notifications')}
          className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-gray-950 animate-ping" />
          )}
        </button>

        {/* Profile Avatar / Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors focus:outline-none"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 border-b border-white/5 mb-1">
                <div className="font-semibold text-xs text-white">{userProfile.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{userProfile.email}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified Saarathi Pro</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectView('notifications');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Profile & Settings</span>
              </button>

              <button
                onClick={() => {
                  onOpenAuth('signin');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors"
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
