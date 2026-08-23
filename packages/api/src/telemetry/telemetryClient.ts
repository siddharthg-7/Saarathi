import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  TelemetryEvent,
  TelemetryEventType,
  TelemetryEntityType,
  TelemetryPlatform,
  TaskEventMetadata,
  FocusEventMetadata,
  ReminderEventMetadata,
  EnergyEventMetadata,
  MoodEventMetadata,
  HabitEventMetadata,
  KairoEventMetadata,
  NavigationEventMetadata,
  EnergyLevelValue,
  MoodLevelValue,
  LogSource,
} from '@saarathi/types';
import { telemetryQueue } from './telemetryQueue';

export class TelemetryClient {
  private static sessionId: string = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  private static userTimezone: string = 'Asia/Kolkata';

  public static setTimezone(tz: string): void {
    if (tz) {
      this.userTimezone = tz;
    }
  }

  public static getTimezone(): string {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || this.userTimezone;
      } catch {
        return this.userTimezone;
      }
    }
    return this.userTimezone;
  }

  public static getPlatform(): TelemetryPlatform {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'ios';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    return 'web';
  }

  /**
   * Core telemetry dispatch method
   */
  public static async track(
    eventType: TelemetryEventType,
    entityType: TelemetryEntityType,
    metadata: Record<string, unknown> = {},
    entityId?: string,
    userId?: string
  ): Promise<TelemetryEvent> {
    const currentUid = userId || auth.currentUser?.uid || 'guest_user';
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();

    // Data minimization: strip sensitive fields
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    const event: TelemetryEvent = {
      id: eventId,
      userId: currentUid,
      eventType,
      timestamp: nowIso,
      timezone: this.getTimezone(),
      platform: this.getPlatform(),
      sessionId: this.sessionId,
      entityType,
      entityId,
      metadata: sanitizedMetadata,
      createdAt: nowIso,
      syncStatus: 'pending',
    };

    // 1. Enqueue in local offline queue
    telemetryQueue.enqueue(event);

    // 2. Direct write to Firestore if authenticated & db is available
    if (currentUid && currentUid !== 'guest_user' && db) {
      try {
        const docRef = doc(db, 'users', currentUid, 'telemetry', eventId);
        await setDoc(docRef, { ...event, syncStatus: 'synced' });
      } catch {
        // Firestore error is swallowed because event is already in the offline queue
      }
    }

    return event;
  }

  // --- Strongly Typed Helpers ---

  public static async trackTask(
    eventType:
      | 'task_created'
      | 'task_started'
      | 'task_completed'
      | 'task_cancelled'
      | 'task_deleted'
      | 'task_rescheduled'
      | 'task_postponed'
      | 'task_snoozed'
      | 'task_reopened'
      | 'task_overdue',
    taskId: string,
    metadata: Partial<TaskEventMetadata> = {},
    userId?: string
  ): Promise<TelemetryEvent> {
    return this.track(
      eventType,
      'task',
      { taskId, ...metadata },
      taskId,
      userId
    );
  }

  public static async trackFocus(
    eventType:
      | 'focus_started'
      | 'focus_paused'
      | 'focus_resumed'
      | 'focus_completed'
      | 'focus_abandoned'
      | 'focus_interrupted',
    sessionId: string,
    metadata: Partial<FocusEventMetadata> = {},
    userId?: string
  ): Promise<TelemetryEvent> {
    return this.track(
      eventType,
      'focus',
      { sessionId, ...metadata },
      metadata.taskId || sessionId,
      userId
    );
  }

  public static async trackReminder(
    eventType:
      | 'reminder_scheduled'
      | 'reminder_sent'
      | 'reminder_opened'
      | 'reminder_ignored'
      | 'reminder_snoozed'
      | 'reminder_completed'
      | 'reminder_dismissed'
      | 'reminder_cancelled',
    reminderId: string,
    metadata: Partial<ReminderEventMetadata> = {},
    userId?: string
  ): Promise<TelemetryEvent> {
    return this.track(
      eventType,
      'reminder',
      { reminderId, ...metadata },
      reminderId,
      userId
    );
  }

  public static async trackEnergy(
    level: EnergyLevelValue,
    source: LogSource = 'manual',
    notes?: string,
    userId?: string
  ): Promise<TelemetryEvent> {
    const metadata: EnergyEventMetadata = { level, source, notes };
    return this.track('energy_logged', 'energy', metadata as any, undefined, userId);
  }

  public static async trackMood(
    level: MoodLevelValue,
    source: LogSource = 'manual',
    notes?: string,
    userId?: string
  ): Promise<TelemetryEvent> {
    const metadata: MoodEventMetadata = { level, source, notes };
    return this.track('mood_logged', 'mood', metadata as any, undefined, userId);
  }

  public static async trackHabit(
    eventType:
      | 'habit_created'
      | 'habit_completed'
      | 'habit_missed'
      | 'habit_skipped'
      | 'habit_rescheduled',
    habitId: string,
    metadata: Partial<HabitEventMetadata> = {},
    userId?: string
  ): Promise<TelemetryEvent> {
    return this.track(
      eventType,
      'habit',
      { habitId, ...metadata },
      habitId,
      userId
    );
  }

  public static async trackKairo(
    eventType:
      | 'kairo_session_started'
      | 'kairo_message_sent'
      | 'kairo_response_received'
      | 'kairo_task_created'
      | 'kairo_task_modified'
      | 'kairo_brain_dump_started'
      | 'kairo_brain_dump_completed'
      | 'kairo_recommendation_shown'
      | 'kairo_recommendation_accepted'
      | 'kairo_recommendation_rejected',
    metadata: Partial<KairoEventMetadata> = {},
    userId?: string
  ): Promise<TelemetryEvent> {
    return this.track(
      eventType,
      'kairo',
      metadata,
      metadata.recommendationId || metadata.taskCreatedId || undefined,
      userId
    );
  }

  public static async trackNavigation(
    viewName: string,
    previousView?: string,
    dwellTimeSeconds?: number,
    userId?: string
  ): Promise<TelemetryEvent> {
    const metadata: NavigationEventMetadata = { viewName, previousView, dwellTimeSeconds };
    let eventType: TelemetryEventType = 'analytics_view_opened';
    if (viewName === 'focus') eventType = 'focus_view_opened';
    else if (viewName === 'tasks') eventType = 'task_view_opened';

    return this.track(eventType, 'navigation', metadata as any, undefined, userId);
  }

  private static sanitizeMetadata(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    const prohibitedKeys = [
      'password',
      'token',
      'secret',
      'auth',
      'credential',
      'apiKey',
      'bearer',
      'rawAudio',
      'audioBuffer',
      'privateMessage',
    ];

    for (const [key, value] of Object.entries(data)) {
      if (prohibitedKeys.some((p) => key.toLowerCase().includes(p))) {
        continue; // Exclude sensitive keys
      }
      cleaned[key] = value;
    }
    return cleaned;
  }
}
