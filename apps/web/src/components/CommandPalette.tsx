import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Bot,
  Mic,
  Timer,
  Flame,
  Target,
  BarChart3,
  Settings,
  Bell,
  Sparkles,
  Plus,
  ArrowRight,
  X,
  User,
  Home,
} from 'lucide-react';
import { ViewType, AuthModalMode } from '@saarathi/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: ViewType) => void;
  onOpenAuth: (mode: AuthModalMode) => void;
  onQuickTaskCreate?: (title: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onOpenAuth,
  onQuickTaskCreate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via window event if managed globally
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'view_dashboard',
      label: 'Go to Home Dashboard',
      category: 'Views',
      icon: LayoutDashboard,
      action: () => onSelectView('dashboard'),
    },
    {
      id: 'view_today',
      label: 'Go to Today Time-blocked Schedule',
      category: 'Views',
      icon: CalendarDays,
      action: () => onSelectView('today'),
    },
    {
      id: 'view_calendar',
      label: 'Go to Calendar View',
      category: 'Views',
      icon: CalendarDays,
      action: () => onSelectView('calendar'),
    },
    {
      id: 'view_tasks',
      label: 'Go to Task Board (Kanban & List)',
      category: 'Views',
      icon: CheckSquare,
      action: () => onSelectView('tasks'),
    },
    {
      id: 'view_aichat',
      label: 'Chat with Kairo AI Assistant',
      category: 'Intelligence',
      icon: Bot,
      action: () => onSelectView('aichat'),
    },
    {
      id: 'view_braindump',
      label: 'Open Voice Brain Dump Mode',
      category: 'Intelligence',
      icon: Mic,
      action: () => onSelectView('braindump'),
    },
    {
      id: 'view_focus',
      label: 'Start Focus Mode (Pomodoro Timer)',
      category: 'Intelligence',
      icon: Timer,
      action: () => onSelectView('focus'),
    },
    {
      id: 'view_analytics',
      label: 'View Productivity Analytics & Heatmaps',
      category: 'Growth',
      icon: BarChart3,
      action: () => onSelectView('analytics'),
    },
    {
      id: 'view_habits',
      label: 'Open Habits Engine & Streaks',
      category: 'Growth',
      icon: Flame,
      action: () => onSelectView('habits'),
    },
    {
      id: 'view_goals',
      label: 'Open Goals & Roadmap System',
      category: 'Growth',
      icon: Target,
      action: () => onSelectView('goals'),
    },
    {
      id: 'view_settings',
      label: 'Open Saarathi Settings',
      category: 'System',
      icon: Settings,
      action: () => onSelectView('settings'),
    },
    {
      id: 'view_notifications',
      label: 'View Proactive Notifications & Profile',
      category: 'System',
      icon: Bell,
      action: () => onSelectView('notifications'),
    },
    {
      id: 'view_landing',
      label: 'View Saarathi Landing Page',
      category: 'Views',
      icon: Home,
      action: () => onSelectView('landing'),
    },
    {
      id: 'auth_signin',
      label: 'Sign In to Saarathi OS',
      category: 'Account',
      icon: User,
      action: () => onOpenAuth('signin'),
    },
    {
      id: 'auth_register',
      label: 'Create New Account',
      category: 'Account',
      icon: Sparkles,
      action: () => onOpenAuth('register'),
    },
  ];

  const filtered = actions.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleQuickCreate = () => {
    if (query.trim() && onQuickTaskCreate) {
      onQuickTaskCreate(query.trim());
      setQuery('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-indigo-500/20">
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3 border-b border-white/10 bg-gray-950/60">
          <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search screens, commands, or type a task title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleQuickCreate();
              }
            }}
            autoFocus
            className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
          {query.trim() && (
            <button
              onClick={handleQuickCreate}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 transition-all text-xs font-medium text-left my-1"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Quick Create Task: <strong className="text-white">"{query}"</strong>
              </span>
              <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">
                Press Enter ↵
              </span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 my-0.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-gray-800 border border-white/5 text-gray-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-[10px] text-gray-500">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-gray-500">
              No matching commands found. Press Enter to create task "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-gray-950/80 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-white/10 rounded text-gray-400 font-mono">
              ↑↓
            </kbd>
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-white/10 rounded text-gray-400 font-mono">
              ↵
            </kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Saarathi Raycast Command Line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
