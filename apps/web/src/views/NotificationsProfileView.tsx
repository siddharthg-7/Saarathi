import React, { useState } from 'react';
import {
  Bell,
  User,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Flame,
  CheckCircle2,
  Mail,
  Phone,
  Download,
  Trash2,
  Clock,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Check,
  ArrowRight,
  Filter,
  CheckCheck,
  Eye,
  EyeOff,
  Settings2,
  Zap,
  Info,
  Calendar,
} from 'lucide-react';
import {
  NotificationItem,
  UserProfile,
  NotificationPreferences,
  NotificationPermissionStatus,
  SmartReminderRecommendation,
  Task,
} from '@saarathi/types';
import { useNotificationStore } from '@saarathi/store';
import { useTaskStore } from '@saarathi/store';
import { toast } from 'react-toastify';

interface NotificationsProfileViewProps {
  notifications: NotificationItem[];
  userProfile: UserProfile;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigateToTask?: (taskId: string) => void;
}

export const NotificationsProfileView: React.FC<NotificationsProfileViewProps> = ({
  notifications,
  userProfile,
  onMarkRead,
  onClearAll,
  onUpdateProfile,
  onNavigateToTask,
}) => {
  const {
    preferences,
    updatePreferences,
    permissionStatus,
    requestPermission,
    recommendations,
    acceptRecommendation,
    dismissRecommendation,
    executeAction,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const { toggleTaskComplete, updateTask, tasks } = useTaskStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'reminders' | 'ai' | 'preferences'>('all');
  const [snoozeMenuOpenId, setSnoozeMenuOpenId] = useState<string | null>(null);

  // Grouping filter
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.read;
    if (activeTab === 'reminders') return item.type === 'task_reminder' || !!item.taskId;
    if (activeTab === 'ai') return item.type === 'smart_nudge' || item.type === 'ai_insight' || item.type === 'risk_alert';
    return true;
  });

  // Group by Date: Today, Yesterday, Older
  const groupNotificationsByDate = (items: NotificationItem[]) => {
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toDateString();

    const groups: { today: NotificationItem[]; yesterday: NotificationItem[]; older: NotificationItem[] } = {
      today: [],
      yesterday: [],
      older: [],
    };

    items.forEach((item) => {
      const itemDate = new Date(item.timestamp || Date.now()).toDateString();
      if (itemDate === todayStr) {
        groups.today.push(item);
      } else if (itemDate === yesterdayStr) {
        groups.yesterday.push(item);
      } else {
        groups.older.push(item);
      }
    });

    return groups;
  };

  const grouped = groupNotificationsByDate(filteredNotifications);

  const handleAction = async (notificationId: string, actionId: string, taskId?: string) => {
    setSnoozeMenuOpenId(null);
    if (actionId === 'done' && taskId) {
      await toggleTaskComplete(taskId);
      toast.success('Task marked as completed!');
    }
    await executeAction(notificationId, actionId, (tId) => toggleTaskComplete(tId));
  };

  const handleAcceptRecommendation = (rec: SmartReminderRecommendation) => {
    acceptRecommendation(rec.id, (taskId, newTime) => {
      updateTask(taskId, { scheduledTime: newTime });
      toast.success(`Task rescheduled to ${newTime}`);
    });
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (res === 'granted') {
      toast.success('Notification permissions enabled!');
    } else if (res === 'denied') {
      toast.error('Notifications were blocked in your browser settings.');
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'risk_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'smart_nudge':
      case 'schedule_nudge':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'streak_celebration':
        return <Flame className="w-4 h-4 text-emerald-400" />;
      case 'ai_insight':
        return <CheckCircle2 className="w-4 h-4 text-purple-400" />;
      case 'task_reminder':
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* User Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                userProfile.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={userProfile.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-500/30"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">{userProfile.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  {userProfile.brandingName}
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-md">{userProfile.bio}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> {userProfile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> {userProfile.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const dataStr =
                  'data:text/json;charset=utf-8,' +
                  encodeURIComponent(JSON.stringify({ userProfile, preferences }, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', dataStr);
                downloadAnchor.setAttribute('download', 'saarathi_profile_telemetry.json');
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permission Contextual Alert Banner */}
      {permissionStatus !== 'granted' && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Enable Task Reminders & Smart Alerts</h4>
              <p className="text-xs text-gray-300">
                Receive proactive reminders for upcoming tasks, smart energy suggestions, and focus alerts.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all shrink-0"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Kairo Smart Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin-slow" />
              <span>Kairo Smart Reschedule Recommendations</span>
            </h3>
            <span className="text-[11px] text-purple-400/80 font-mono">
              {recommendations.length} {recommendations.length === 1 ? 'recommendation' : 'recommendations'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-gray-950/80 border border-purple-500/20 flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rec.taskTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {rec.recommendedTime}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{rec.reason}</p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <button
                    onClick={() => handleAcceptRecommendation(rec)}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Reschedule</span>
                  </button>
                  <button
                    onClick={() => dismissRecommendation(rec.id)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-xl transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>All ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'unread'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Unread ({notifications.filter((n) => !n.read).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'reminders'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Task Reminders</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Insights & Nudges</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'preferences'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Preferences & Quiet Hours</span>
        </button>
      </div>

      {/* Tab Content: Notification Center vs Preferences */}
      {activeTab !== 'preferences' ? (
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Notification Center</span>
            </h3>

            <div className="flex items-center gap-3">
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All as Read</span>
              </button>

              <button
                onClick={onClearAll}
                className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-400">No notifications found</p>
              <p className="text-xs text-gray-500">You're all caught up on your tasks and alerts!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Today Group */}
              {grouped.today.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today</h4>
                  {grouped.today.map((notif) => renderNotificationCard(notif))}
                </div>
              )}

              {/* Yesterday Group */}
              {grouped.yesterday.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yesterday</h4>
                  {grouped.yesterday.map((notif) => renderNotificationCard(notif))}
                </div>
              )}

              {/* Older Group */}
              {grouped.older.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Older</h4>
                  {grouped.older.map((notif) => renderNotificationCard(notif))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* TAB CONTENT: PREFERENCES & QUIET HOURS */
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-6 shadow-xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <span>Notification Preferences & Scheduling Rules</span>
            </h3>
            <p className="text-xs text-gray-400 pt-1">
              Configure how Saarathi delivers task alerts, smart reminders, sound, and quiet hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Master Toggle */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span>Master Notifications</span>
                </div>
                <p className="text-[11px] text-gray-400">Enable or disable all notifications system-wide.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.globalNotificationEnabled}
                onChange={(e) => updatePreferences({ globalNotificationEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Task Reminders */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Task Reminders</span>
                </div>
                <p className="text-[11px] text-gray-400">Scheduled reminders for due tasks and deadlines.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.taskReminderEnabled}
                onChange={(e) => updatePreferences({ taskReminderEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Smart Reminders (Kairo) */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Smart Reminders (Kairo)</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Allow Kairo to intelligently nudge and recommend schedule adjustments.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.smartReminderEnabled}
                onChange={(e) => updatePreferences({ smartReminderEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Daily Brief */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Morning Daily Brief</span>
                </div>
                <p className="text-[11px] text-gray-400">Receive morning productivity overview and plan.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.dailyBriefEnabled}
                onChange={(e) => updatePreferences({ dailyBriefEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Habit Reminders */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Habit Reminders</span>
                </div>
                <p className="text-[11px] text-gray-400">Daily habit check-ins and streak maintenance nudges.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.habitReminderEnabled}
                onChange={(e) => updatePreferences({ habitReminderEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Focus Sessions */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Focus Sessions</span>
                </div>
                <p className="text-[11px] text-gray-400">Pomodoro focus alerts and break notifications.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.focusReminderEnabled}
                onChange={(e) => updatePreferences({ focusReminderEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Audio Sound */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  {preferences.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Notification Sound</span>
                </div>
                <p className="text-[11px] text-gray-400">Play chime when reminders trigger.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Vibration */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-indigo-400" />
                  <span>Vibration Alert</span>
                </div>
                <p className="text-[11px] text-gray-400">Vibrate mobile and supported devices on alert.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.vibrationEnabled}
                onChange={(e) => updatePreferences({ vibrationEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Privacy Mode */}
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between md:col-span-2">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  {preferences.showSensitiveDetails ? (
                    <Eye className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Lockscreen & Ambient Privacy</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {preferences.showSensitiveDetails
                    ? 'Showing full task titles and categories in notification popups.'
                    : 'Masking sensitive task descriptions ("You have a task waiting in Saarathi").'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.showSensitiveDetails}
                onChange={(e) => updatePreferences({ showSensitiveDetails: e.target.checked })}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Quiet Hours Settings */}
            <div className="p-5 rounded-2xl bg-gray-950 border border-white/10 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Quiet Hours</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Automatically mute and delay non-critical task alerts during sleep hours.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) =>
                    updatePreferences({
                      quietHours: { ...preferences.quietHours, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Start Time:</span>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) =>
                        updatePreferences({
                          quietHours: { ...preferences.quietHours, start: e.target.value },
                        })
                      }
                      className="px-3 py-1.5 bg-gray-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">End Time:</span>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) =>
                        updatePreferences({
                          quietHours: { ...preferences.quietHours, end: e.target.value },
                        })
                      }
                      className="px-3 py-1.5 bg-gray-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <span className="text-[11px] text-gray-500 italic">
                    (Critical priority reminders will continue to alert)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderNotificationCard(notif: NotificationItem) {
    return (
      <div
        key={notif.id}
        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          notif.read
            ? 'bg-gray-950/40 border-white/5 opacity-75'
            : 'bg-gray-950 border-white/10 hover:border-indigo-500/30 shadow-lg'
        }`}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2.5 rounded-xl bg-gray-900 border border-white/5 shrink-0 mt-0.5">
            {getIcon(notif.type)}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">{notif.title}</span>
              {!notif.read && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              {notif.priority && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    notif.priority === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : notif.priority === 'High'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {notif.priority}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-300 leading-snug">{notif.message}</p>
            {notif.reason && (
              <p className="text-[11px] text-indigo-300/80 italic flex items-center gap-1 pt-0.5">
                <Info className="w-3 h-3 text-indigo-400" />
                <span>{notif.reason}</span>
              </p>
            )}
            <span className="text-[10px] text-gray-500 font-mono block pt-1">{notif.time}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center relative">
          {/* Done Action */}
          {notif.taskId && (
            <button
              onClick={() => handleAction(notif.id, 'done', notif.taskId)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          )}

          {/* Snooze Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSnoozeMenuOpenId(snoozeMenuOpenId === notif.id ? null : notif.id)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium border border-white/10 flex items-center gap-1 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze</span>
            </button>

            {snoozeMenuOpenId === notif.id && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-gray-900 border border-white/15 rounded-2xl shadow-2xl py-1 z-30 space-y-1">
                <button
                  onClick={() => handleAction(notif.id, 'snooze_10', notif.taskId)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  10 Minutes
                </button>
                <button
                  onClick={() => handleAction(notif.id, 'snooze_30', notif.taskId)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  30 Minutes
                </button>
                <button
                  onClick={() => handleAction(notif.id, 'snooze_60', notif.taskId)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  1 Hour
                </button>
                <button
                  onClick={() => handleAction(notif.id, 'tomorrow', notif.taskId)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors border-t border-white/5"
                >
                  Tomorrow (9 AM)
                </button>
              </div>
            )}
          </div>

          {/* Mark read / Dismiss */}
          {!notif.read ? (
            <button
              onClick={() => onMarkRead(notif.id)}
              className="p-1.5 text-gray-400 hover:text-indigo-400 rounded-lg transition-colors"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => deleteNotification(notif.id)}
              className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
};
