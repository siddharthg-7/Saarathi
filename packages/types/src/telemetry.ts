export type TelemetryPlatform = 'android' | 'ios' | 'web' | 'windows' | 'macos';

export type TelemetryEntityType =
  | 'task'
  | 'focus'
  | 'reminder'
  | 'energy'
  | 'mood'
  | 'habit'
  | 'kairo'
  | 'navigation'
  | 'system';

export type TaskTelemetryEventType =
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'task_deleted'
  | 'task_rescheduled'
  | 'task_postponed'
  | 'task_snoozed'
  | 'task_reopened'
  | 'task_overdue';

export type FocusTelemetryEventType =
  | 'focus_started'
  | 'focus_paused'
  | 'focus_resumed'
  | 'focus_completed'
  | 'focus_abandoned'
  | 'focus_interrupted';

export type ReminderTelemetryEventType =
  | 'reminder_scheduled'
  | 'reminder_sent'
  | 'reminder_opened'
  | 'reminder_ignored'
  | 'reminder_snoozed'
  | 'reminder_completed'
  | 'reminder_dismissed'
  | 'reminder_cancelled';

export type EnergyTelemetryEventType = 'energy_logged';
export type MoodTelemetryEventType = 'mood_logged';

export type HabitTelemetryEventType =
  | 'habit_created'
  | 'habit_completed'
  | 'habit_missed'
  | 'habit_skipped'
  | 'habit_rescheduled';

export type KairoTelemetryEventType =
  | 'kairo_session_started'
  | 'kairo_message_sent'
  | 'kairo_response_received'
  | 'kairo_task_created'
  | 'kairo_task_modified'
  | 'kairo_brain_dump_started'
  | 'kairo_brain_dump_completed'
  | 'kairo_recommendation_shown'
  | 'kairo_recommendation_accepted'
  | 'kairo_recommendation_rejected';

export type ResilienceTelemetryEventType =
  | 'provider_request'
  | 'provider_success'
  | 'provider_failure'
  | 'provider_timeout'
  | 'provider_rate_limit'
  | 'retry_started'
  | 'retry_exhausted'
  | 'circuit_opened'
  | 'circuit_half_open'
  | 'circuit_closed'
  | 'fallback_used'
  | 'cache_hit'
  | 'cache_miss'
  | 'audio_queued'
  | 'audio_retry'
  | 'audio_completed'
  | 'audio_failed'
  | 'websocket_reconnect'
  | 'offline_operation_queued';

export type NavigationTelemetryEventType =
  | 'analytics_view_opened'
  | 'focus_view_opened'
  | 'task_view_opened';

export type TelemetryEventType =
  | TaskTelemetryEventType
  | FocusTelemetryEventType
  | ReminderTelemetryEventType
  | EnergyTelemetryEventType
  | MoodTelemetryEventType
  | HabitTelemetryEventType
  | KairoTelemetryEventType
  | ResilienceTelemetryEventType
  | NavigationTelemetryEventType;

export type EnergyLevelValue = 'low' | 'medium' | 'high';
export type MoodLevelValue = 'very_low' | 'low' | 'neutral' | 'good' | 'very_good';
export type LogSource = 'manual' | 'kairo' | 'daily_checkin';

export type SystemDegradationLevel = 0 | 1 | 2 | 3 | 4;

export interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  circuitOpenCount: number;
  totalCircuitOpenDuration: number;
  openTimeRemainingSeconds: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  lastFailure?: number | null;
  lastSuccess?: number | null;
  lastErrorCategory?: string | null;
  lastErrorMessage?: string | null;
}

export interface OfflineAudioJob {
  id: string;
  userId: string;
  localFilePath: string;
  createdAt: string;
  status: 'queued' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed' | 'retry_wait' | 'cancelled';
  retryCount: number;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  checksum?: string | null;
  remoteId?: string | null;
}

export interface TaskEventMetadata {
  taskId: string;
  title?: string;
  category?: string;
  priority?: string;
  energyRequired?: string;
  estimatedDuration?: number;
  postponeCount?: number;
  rescheduleCount?: number;
  scheduledTime?: string;
  deadline?: string;
  completedOnTime?: boolean;
  completionDurationMinutes?: number;
  reason?: string;
  [key: string]: unknown;
}

export interface FocusEventMetadata {
  sessionId: string;
  taskId?: string;
  taskTitle?: string;
  mode: 'work' | 'shortBreak' | 'longBreak';
  plannedDurationMinutes: number;
  actualDurationSeconds: number;
  pauseDurationSeconds?: number;
  interruptionCount?: number;
  ambientSound?: string;
  completionStatus?: 'completed' | 'abandoned' | 'in_progress';
  [key: string]: unknown;
}

export interface ReminderEventMetadata {
  reminderId: string;
  taskId?: string;
  reminderType?: string;
  channel?: string;
  snoozeMinutes?: number;
  snoozeCount?: number;
  timeToOpenMs?: number;
  completedViaAction?: boolean;
  [key: string]: unknown;
}

export interface EnergyEventMetadata {
  level: EnergyLevelValue;
  source: LogSource;
  notes?: string;
  [key: string]: unknown;
}

export interface MoodEventMetadata {
  level: MoodLevelValue;
  source: LogSource;
  notes?: string;
  [key: string]: unknown;
}

export interface HabitEventMetadata {
  habitId: string;
  title?: string;
  category?: string;
  streakCount?: number;
  dayIndex?: number;
  targetDaysPerWeek?: number;
  [key: string]: unknown;
}

export interface KairoEventMetadata {
  sessionId?: string;
  messageType?: 'text' | 'voice' | 'brain_dump' | 'action';
  responseLatencyMs?: number;
  toolUsed?: string;
  taskCreatedId?: string;
  taskModifiedId?: string;
  recommendationId?: string;
  recommendationType?: string;
  actionType?: string;
  source?: string;
  [key: string]: unknown;
}

export interface NavigationEventMetadata {
  viewName: string;
  previousView?: string;
  dwellTimeSeconds?: number;
  [key: string]: unknown;
}

export type TelemetryMetadata =
  | TaskEventMetadata
  | FocusEventMetadata
  | ReminderEventMetadata
  | EnergyEventMetadata
  | MoodEventMetadata
  | HabitEventMetadata
  | KairoEventMetadata
  | NavigationEventMetadata
  | Record<string, unknown>;

export type TelemetrySyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface TelemetryEvent {
  id: string;
  userId: string;
  eventType: TelemetryEventType;
  timestamp: string; // ISO 8601 canonical timestamp
  timezone: string;  // IANA timezone identifier e.g. 'Asia/Kolkata'
  platform: TelemetryPlatform;
  sessionId: string;
  entityType: TelemetryEntityType;
  entityId?: string;
  metadata: TelemetryMetadata;
  createdAt: string;
  syncStatus?: TelemetrySyncStatus;
  retryCount?: number;
}
