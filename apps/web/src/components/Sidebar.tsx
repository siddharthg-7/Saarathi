import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  CheckSquare,
  Bot,
  Mic,
  Timer,
  BarChart3,
  Flame,
  Target,
  Settings,
  Bell,
  Home,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { ViewType } from '@saarathi/types';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unreadNotificationsCount: number;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  unreadNotificationsCount,
}) => {
  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'MAIN WORKSPACE',
      items: [
        { id: 'dashboard' as ViewType, label: 'Home Dashboard', icon: LayoutDashboard },
        { id: 'today' as ViewType, label: "Today's Schedule", icon: CalendarDays },
        { id: 'calendar' as ViewType, label: 'Calendar View', icon: Calendar },
        { id: 'tasks' as ViewType, label: 'Task Board', icon: CheckSquare },
      ],
    },
    {
      title: 'KAIRO INTELLIGENCE',
      items: [
        { id: 'aichat' as ViewType, label: 'Kairo AI Assistant', icon: Bot, badge: 'AI' },
        { id: 'braindump' as ViewType, label: 'Voice Brain Dump', icon: Mic, badge: 'Voice' },
        { id: 'focus' as ViewType, label: 'Focus Mode', icon: Timer, badge: '25m' },
      ],
    },
    {
      title: 'GROWTH & HABITS',
      items: [
        { id: 'analytics' as ViewType, label: 'Analytics & Heatmaps', icon: BarChart3 },
        { id: 'habits' as ViewType, label: 'Habits Engine', icon: Flame, badge: '14 Days' },
        { id: 'goals' as ViewType, label: 'Goals & Milestones', icon: Target },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings' as ViewType, label: 'Settings & Models', icon: Settings },
        {
          id: 'notifications' as ViewType,
          label: 'Notifications',
          icon: Bell,
          count: unreadNotificationsCount,
        },
        { id: 'landing' as ViewType, label: 'Public Landing Page', icon: Home },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-950/95 border-r border-white/10 p-4 text-xs font-medium">
      {/* App Branding Banner */}
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Saarathi OS</div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>Kairo AI Powered</span>
            </div>
          </div>
        </div>

        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-gray-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        {item.badge}
                      </span>
                    )}

                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Kairo Proactive Nudge Footer */}
      <div className="mt-4 p-3 bg-gray-900 border border-white/10 rounded-2xl shadow-lg shadow-indigo-500/5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-gray-200 text-[11px]">Kairo Daily Rec</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Peak focus window starts at 09:30 AM. Tackle DBMS Schema first.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-72 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
