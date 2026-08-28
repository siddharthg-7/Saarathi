import { apiClient } from './client';
import {
  TelemetryEvent,
  DailyAnalytics,
  WeeklyAnalytics,
  MonthlyAnalytics,
  MLBehavioralFeatureVector,
} from '@saarathi/types';
import { TelemetryClient } from './telemetry/telemetryClient';
import { telemetryQueue } from './telemetry/telemetryQueue';

export interface TelemetryEventPayload {
  taskId: string;
  eventType: 'COMPLETED' | 'POSTPONED' | 'SKIPPED' | 'CREATED' | 'DELETED';
  currentPostponeCount?: number;
  context?: Record<string, unknown>;
  timestamp?: string;
}

export interface PaginatedTelemetryResponse {
  items: TelemetryEvent[];
  nextCursor: string | null;
  hasMore: boolean;
  count: number;
}

export const telemetryApi = {
  /**
   * Backward-compatible legacy logEvent
   */
  async logEvent(event: TelemetryEventPayload): Promise<void> {
    try {
      const typeMap: Record<string, any> = {
        CREATED: 'task_created',
        COMPLETED: 'task_completed',
        POSTPONED: 'task_postponed',
        SKIPPED: 'task_postponed',
        DELETED: 'task_deleted',
      };
      const mappedType = typeMap[event.eventType] || 'task_created';
      await TelemetryClient.trackTask(mappedType, event.taskId, {
        postponeCount: event.currentPostponeCount,
        ...(event.context || {}),
      });
    } catch {
      console.log(`[Telemetry Logged Local]`, event);
    }
  },

  /**
   * Log a strongly typed TelemetryEvent
   */
  async postEvent(event: TelemetryEvent): Promise<void> {
    try {
      await apiClient.post<void>('/telemetry/event', event);
    } catch {
      // Offline fallback: enqueued in TelemetryQueue
      telemetryQueue.enqueue(event);
    }
  },

  /**
   * Post a batch of events
   */
  async postBatch(events: TelemetryEvent[]): Promise<{ status: string; processed: number }> {
    return apiClient.post<{ status: string; processed: number }>('/telemetry/batch', { events });
  },

  /**
   * Fetch daily aggregated analytics
   */
  async getDailyAnalytics(date?: string, timezone?: string): Promise<DailyAnalytics> {
    const tz = timezone || TelemetryClient.getTimezone();
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    if (tz) query.append('timezone', tz);
    return apiClient.get<DailyAnalytics>(`/analytics/daily?${query.toString()}`);
  },

  /**
   * Fetch weekly aggregated analytics report
   */
  async getWeeklyAnalytics(weekId?: string, timezone?: string): Promise<WeeklyAnalytics> {
    const tz = timezone || TelemetryClient.getTimezone();
    const query = new URLSearchParams();
    if (weekId) query.append('weekId', weekId);
    if (tz) query.append('timezone', tz);
    return apiClient.get<WeeklyAnalytics>(`/analytics/weekly?${query.toString()}`);
  },

  /**
   * Fetch monthly aggregated analytics report
   */
  async getMonthlyAnalytics(monthId?: string, timezone?: string): Promise<MonthlyAnalytics> {
    const tz = timezone || TelemetryClient.getTimezone();
    const query = new URLSearchParams();
    if (monthId) query.append('monthId', monthId);
    if (tz) query.append('timezone', tz);
    return apiClient.get<MonthlyAnalytics>(`/analytics/monthly?${query.toString()}`);
  },

  /**
   * Fetch Phase 9 ML feature dataset
   */
  async getMLDataset(limit: number = 100): Promise<{ features: MLBehavioralFeatureVector[]; count: number }> {
    return apiClient.get<{ features: MLBehavioralFeatureVector[]; count: number }>(
      `/analytics/ml-dataset?limit=${limit}`
    );
  },

  /**
   * High-performance paginated telemetry fetching
   */
  async getPaginatedEvents(
    eventType?: string,
    pageSize: number = 50,
    cursor?: string
  ): Promise<PaginatedTelemetryResponse> {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (eventType) params.append('eventType', eventType);
    if (cursor) params.append('cursor', cursor);
    return apiClient.get<PaginatedTelemetryResponse>(`/telemetry/events?${params.toString()}`);
  },

  /**
   * Log mood & energy explicitly
   */
  async logMoodEnergy(data: {
    energy?: 'low' | 'medium' | 'high';
    mood?: 'very_low' | 'low' | 'neutral' | 'good' | 'very_good';
    source?: 'manual' | 'kairo' | 'daily_checkin';
    notes?: string;
  }): Promise<{ status: string }> {
    if (data.energy) {
      await TelemetryClient.trackEnergy(data.energy, data.source || 'manual', data.notes);
    }
    if (data.mood) {
      await TelemetryClient.trackMood(data.mood, data.source || 'manual', data.notes);
    }
    return { status: 'ok' };
  },
};
