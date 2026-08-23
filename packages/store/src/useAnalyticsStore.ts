import { create } from 'zustand';
import {
  AnalyticsData,
  ColdStartStatus,
  EnergyLevelValue,
  MoodLevelValue,
  LogSource,
  Task,
  Reminder,
  Habit,
  TelemetryEvent,
} from '@saarathi/types';
import {
  AggregationEngine,
  TelemetryClient,
  telemetryQueue,
  telemetryApi,
} from '@saarathi/api';
import { initialAnalytics } from './data/initialData';

export type AnalyticsTimeRange = 'today' | '7d' | '30d';

interface AnalyticsState {
  timeRange: AnalyticsTimeRange;
  analyticsData: AnalyticsData;
  isLoading: boolean;
  activeUid: string | null;
  activeTimezone: string;
  queueStatus: {
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    total: number;
  };

  setTimeRange: (range: AnalyticsTimeRange) => void;
  setTimezone: (timezone: string) => void;
  refreshAnalytics: (
    tasks?: Task[],
    reminders?: Reminder[],
    habits?: Habit[],
    events?: TelemetryEvent[]
  ) => void;
  logMoodAndEnergy: (
    energy?: EnergyLevelValue,
    mood?: MoodLevelValue,
    source?: LogSource,
    notes?: string
  ) => Promise<void>;
  flushTelemetryQueue: () => Promise<void>;
  initAnalyticsListener: (uid: string) => () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  timeRange: '7d',
  analyticsData: initialAnalytics,
  isLoading: false,
  activeUid: null,
  activeTimezone: TelemetryClient.getTimezone(),
  queueStatus: telemetryQueue.getStatusSummary(),

  setTimeRange: (range) => {
    set({ timeRange: range });
    TelemetryClient.trackNavigation('analytics', undefined, undefined, get().activeUid || undefined);
  },

  setTimezone: (tz) => {
    TelemetryClient.setTimezone(tz);
    set({ activeTimezone: tz });
  },

  refreshAnalytics: (tasks = [], reminders = [], habits = [], events = []) => {
    const { activeUid, activeTimezone } = get();
    const assembled = AggregationEngine.assembleAnalytics(
      activeUid || 'usr_current',
      tasks,
      reminders,
      habits,
      events,
      activeTimezone
    );
    set({
      analyticsData: assembled,
      queueStatus: telemetryQueue.getStatusSummary(),
    });
  },

  logMoodAndEnergy: async (energy, mood, source = 'manual', notes) => {
    const { activeUid } = get();
    if (energy) {
      await TelemetryClient.trackEnergy(energy, source, notes, activeUid || undefined);
    }
    if (mood) {
      await TelemetryClient.trackMood(mood, source, notes, activeUid || undefined);
    }
    await telemetryApi.logMoodEnergy({ energy, mood, source, notes });
    set({ queueStatus: telemetryQueue.getStatusSummary() });
  },

  flushTelemetryQueue: async () => {
    set({ isLoading: true });
    try {
      await telemetryQueue.flush();
    } finally {
      set({
        isLoading: false,
        queueStatus: telemetryQueue.getStatusSummary(),
      });
    }
  },

  initAnalyticsListener: (uid: string) => {
    set({ activeUid: uid });
    TelemetryClient.setTimezone(get().activeTimezone);
    set({ queueStatus: telemetryQueue.getStatusSummary() });

    // Poll queue status periodically
    const timer = setInterval(() => {
      set({ queueStatus: telemetryQueue.getStatusSummary() });
    }, 5000);

    return () => clearInterval(timer);
  },
}));
