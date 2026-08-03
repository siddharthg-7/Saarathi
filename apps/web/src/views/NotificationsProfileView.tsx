import React from 'react';
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
} from 'lucide-react';
import { NotificationItem, UserProfile } from '@saarathi/types';

interface NotificationsProfileViewProps {
  notifications: NotificationItem[];
  userProfile: UserProfile;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const NotificationsProfileView: React.FC<NotificationsProfileViewProps> = ({
  notifications,
  userProfile,
  onMarkRead,
  onClearAll,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* User Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={userProfile.avatar}
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
                  encodeURIComponent(JSON.stringify(userProfile, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', dataStr);
                downloadAnchor.setAttribute('download', 'saarathi_profile.json');
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Telemetry Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proactive Notification History */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Proactive Behavioral Nudges & Alert History</span>
          </h3>

          <button
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((notif) => {
            const icons = {
              risk_alert: <AlertTriangle className="w-4 h-4 text-amber-400" />,
              schedule_nudge: <Sparkles className="w-4 h-4 text-indigo-400" />,
              streak_celebration: <Flame className="w-4 h-4 text-emerald-400" />,
              ai_insight: <CheckCircle2 className="w-4 h-4 text-purple-400" />,
            };

            return (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  notif.read
                    ? 'bg-gray-950/40 border-white/5 opacity-70'
                    : 'bg-gray-950 border-white/10 hover:border-indigo-500/30 shadow-lg'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gray-900 border border-white/5 shrink-0 mt-0.5">
                    {icons[notif.type]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-300 leading-snug">{notif.message}</p>
                    <span className="text-[10px] text-gray-500 font-mono block pt-1">
                      {notif.time}
                    </span>
                  </div>
                </div>

                {notif.actionText && (
                  <button className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-semibold shrink-0 hover:bg-indigo-600/30">
                    {notif.actionText}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
