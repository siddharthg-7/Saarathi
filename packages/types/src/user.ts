export type AuthModalMode = 'signin' | 'register' | null;

export interface UserProfile {
  id: string;
  name: string;
  brandingName: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  aiModel: 'gemini-3.6-flash' | 'groq-llama-3.3' | 'hybrid-orchestrator';
  notificationsEnabled: boolean;
  autoRescheduleHighRisk: boolean;
  theme: 'dark' | 'glass-midnight';
}

export interface UserSettings {
  uid: string;
  theme: 'dark' | 'light' | 'glass-midnight';
  timezone: string;
  notificationsEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  defaultPomodoroDuration: number;
  autoRescheduleHighRisk: boolean;
  syncSettings: boolean;
  updatedAt?: string;
}

export interface UserDevice {
  id: string;
  uid: string;
  deviceId: string;
  deviceModel: string;
  os: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  fcmToken?: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  uid: string;
  startedAt: string;
  lastPingAt: string;
  ipAddress?: string;
  userAgent?: string;
  active: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'risk_alert' | 'schedule_nudge' | 'streak_celebration' | 'ai_insight';
  read: boolean;
  actionText?: string;
}
