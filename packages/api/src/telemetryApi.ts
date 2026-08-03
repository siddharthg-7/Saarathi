import { apiClient } from './client';

export interface TelemetryEventPayload {
  taskId: string;
  eventType: 'COMPLETED' | 'POSTPONED' | 'SKIPPED' | 'CREATED' | 'DELETED';
  currentPostponeCount?: number;
  context?: Record<string, unknown>;
  timestamp?: string;
}

export const telemetryApi = {
  async logEvent(event: TelemetryEventPayload): Promise<void> {
    try {
      await apiClient.post<void>('/telemetry/event', {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      });
    } catch {
      // Telemetry log errors are swallowed silently in fallback mode
      console.log(`[Telemetry Logged Local]`, event);
    }
  },
};
