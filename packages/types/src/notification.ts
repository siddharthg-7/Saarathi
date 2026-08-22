export type ReminderStatus =
  | 'scheduled'
  | 'triggered'
  | 'snoozed'
  | 'completed'
  | 'cancelled'
  | 'missed';

export type ReminderType =
  | 'task'
  | 'habit'
  | 'focus'
  | 'daily_brief'
  | 'smart'
  | 'system';

export type ReminderPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReminderChannel = 'local' | 'fcm' | 'web-push';

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'provisional'
  | 'unavailable'
  | 'default';

export type DevicePlatform = 'android' | 'ios' | 'web' | 'windows' | 'macos';

export type PushProvider = 'expo' | 'fcm' | 'web-push';

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // e.g. "23:00" (24h format)
  end: string;   // e.g. "07:00" (24h format)
}

export interface NotificationPreferences {
  globalNotificationEnabled: boolean;
  taskReminderEnabled: boolean;
  smartReminderEnabled: boolean;
  dailyBriefEnabled: boolean;
  habitReminderEnabled: boolean;
  focusReminderEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: QuietHoursConfig;
  snoozeDefaults: number[]; // e.g. [10, 30, 60] in minutes
  showSensitiveDetails: boolean;
}

export interface NotificationAction {
  actionId: 'done' | 'snooze_10' | 'snooze_30' | 'snooze_60' | 'reschedule' | 'dismiss' | string;
  label: string;
  isDestructive?: boolean;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  time: string;
  timestamp?: number; // unix ms
  type:

    | 'task_reminder'
    | 'smart_nudge'
    | 'daily_brief'
    | 'risk_alert'
    | 'schedule_nudge'
    | 'streak_celebration'
    | 'ai_insight'
    | 'system';
  read: boolean;
  readAt?: string;
  actionText?: string;
  taskId?: string;
  reminderId?: string;
  priority?: ReminderPriority;
  actions?: NotificationAction[];
  reason?: string; // Explainability for AI/smart reminders
}

export interface Reminder {
  id: string;
  userId: string;
  taskId?: string;
  title: string;
  body: string;
  scheduledAt: string; // ISO 8601 string
  timezone: string;    // IANA timezone identifier e.g. 'Asia/Kolkata'
  status: ReminderStatus;
  type: ReminderType;
  priority: ReminderPriority;
  channel: ReminderChannel;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt?: string;
  snoozedUntil?: string;
  snoozeCount: number;
  attemptCount: number;
  lastTriggeredAt?: string;
  reason?: string; // Transparent reasoning for smart reminder rule
  metadata?: Record<string, any>;
}

export interface UserDeviceRegistration {
  deviceId: string;
  userId: string;
  platform: DevicePlatform;
  token: string;
  pushProvider: PushProvider;
  appVersion: string;
  deviceName?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export interface SmartReminderRecommendation {
  id: string;
  taskId: string;
  taskTitle: string;
  currentScheduledTime?: string;
  recommendedTime: string;
  reason: string;
  confidence?: number;
  triggerRule: string;
  accepted?: boolean;
  dismissed?: boolean;
}

export type NotificationAnalyticsEventType =
  | 'reminder_sent'
  | 'reminder_opened'
  | 'reminder_ignored'
  | 'reminder_snoozed'
  | 'reminder_completed'
  | 'reminder_dismissed';

export interface NotificationAnalyticsPayload {
  userId: string;
  reminderId?: string;
  taskId?: string;
  eventType: NotificationAnalyticsEventType;
  timestamp: string;
  channel?: ReminderChannel;
  metadata?: Record<string, any>;
}
