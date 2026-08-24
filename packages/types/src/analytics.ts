export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HourlyProductivitySlot {
  hour: number; // 0 to 23
  label: string; // e.g. "09:00"
  tasksCompleted: number;
  tasksStarted: number;
  focusMinutes: number;
  productivityScore: number; // 0 to 100
  completionRate: number; // 0 to 100
}

export interface WeekdayProductivity {
  dayIndex: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  dayName: string;  // e.g. "Monday"
  shortName: string; // e.g. "Mon"
  completedTasks: number;
  plannedTasks: number;
  completionRate: number; // 0 to 100
  focusMinutes: number;
  averageTaskDurationMinutes: number;
  rescheduleRate: number; // 0 to 100
}

export interface CategoryTimeDistribution {
  category: string;
  count: number;
  focusMinutes?: number;
  completedTasks?: number;
  color: string;
}

export interface ActivityHeatmapCell {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday (or 1=Mon .. 7=Sun)
  dayName: string;
  hour: number;      // 0 to 23
  intensity: number; // 0 to 4
  eventCount: number;
  focusMinutes: number;
}

export interface ActivityHeatmapGrid {
  cells: ActivityHeatmapCell[];
  maxCount: number;
  totalActiveHours: number;
}

export interface EnergyCorrelationStats {
  energyLevel: 'low' | 'medium' | 'high';
  tasksCount: number;
  completionRate: number;
  avgFocusMinutes: number;
  description: string;
}

export interface ReschedulingStats {
  totalRescheduled: number;
  rescheduleRate: number; // percentage of planned tasks rescheduled
  averageReschedulesPerTask: number;
  mostRescheduledCategory?: string;
  mostRescheduledWeekday?: string;
  mostRescheduledHour?: number;
  categoryBreakdown: { category: string; count: number }[];
}

export interface KairoAnalyticsStats {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  avgResponseLatencyMs: number;
  tasksCreatedViaKairo: number;
  tasksModifiedViaKairo: number;
  brainDumpsProcessed: number;
  recommendationsShown: number;
  recommendationsAccepted: number;
  recommendationsRejected: number;
  recommendationAcceptanceRate: number; // percentage 0 to 100
}

export interface HabitStreakMetric {
  habitId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  missedDays: number;
  skippedDays: number;
}

export interface DailyAnalytics {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD in user timezone
  timezone: string;

  tasksPlanned: number;
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  tasksOverdue: number;
  tasksRescheduled: number;
  completionRate: number;

  focusMinutes: number;
  focusSessions: number;
  focusCompletionRate: number;
  interruptionCount: number;

  remindersSent: number;
  remindersOpened: number;
  remindersSnoozed: number;
  remindersIgnored: number;
  reminderResponseRate: number;

  kairoSessions: number;
  kairoMessages: number;

  energyAverage?: number; // 1 (low), 2 (medium), 3 (high)
  moodAverage?: number;   // 1 (very_low) to 5 (very_good)

  habitsCompleted: number;
  habitsMissed: number;
  habitCompletionRate: number;

  productivityScore: number;
  hourlyActivity?: HourlyProductivitySlot[];
}

export interface WeeklyAnalytics {
  id?: string;
  userId: string;
  weekId: string; // e.g. "2026-W34"
  startDate: string;
  endDate: string;
  timezone: string;

  weeklyTasksCompleted: number;
  weeklyTasksPlanned: number;
  weeklyCompletionRate: number;
  weeklyFocusMinutes: number;
  weeklyFocusSessions: number;
  weeklyReminderResponseRate: number;
  weeklyHabitCompletionRate: number;
  weeklyRescheduleRate: number;
  weeklyKairoUsage: number;

  comparisonVsLastWeek: {
    tasksCompletedChangePercent: number;
    completionRateChangePercent: number;
    focusMinutesChangePercent: number;
    habitCompletionChangePercent: number;
  };

  bestObservedPeriod?: string; // e.g. "Tuesday 09:00 - 11:00 AM"
  mostRescheduledCategory?: string;
  weekdayBreakdown: WeekdayProductivity[];
}

export interface MonthlyAnalytics {
  id?: string;
  userId: string;
  monthId: string; // e.g. "2026-08"
  startDate: string;
  endDate: string;
  timezone: string;

  totalCompletedTasks: number;
  totalPlannedTasks: number;
  completionRate: number;
  focusMinutes: number;
  focusSessions: number;
  habitConsistencyRate: number;
  reminderResponseRate: number;
  reschedulingRate: number;

  kairoTotalInteractions: number;
  energyPatterns: EnergyCorrelationStats[];
  reschedulingStats: ReschedulingStats;
  kairoStats: KairoAnalyticsStats;

  comparisonVsLastMonth: {
    tasksCompletedChangePercent: number;
    completionRateChangePercent: number;
    focusMinutesChangePercent: number;
  };

  descriptiveInsights: string[];
}

export type ColdStartPhase =
  | 'zero_data'        // 0 days
  | 'basic_activity'   // 0–2 days
  | 'early_trends'     // 3–6 days
  | 'weekly_patterns'  // 7–29 days
  | 'long_term_trends'; // 30+ days

export interface ColdStartStatus {
  phase: ColdStartPhase;
  daysOfData: number;
  totalEventsCount: number;
  isUnlocked: {
    overview: boolean;
    trends: boolean;
    heatmap: boolean;
    patterns: boolean;
    kairo: boolean;
  };
  guidanceMessage: string;
}

/**
 * Phase 9 Machine Learning feature extraction vector (ready for ML dataset ingestion)
 */
export interface MLBehavioralFeatureVector {
  userId: string;
  taskId?: string;
  taskCategory: string;
  priority: string;
  estimatedDuration: number;
  actualDuration?: number;
  dayOfWeek: number;
  hourOfDay: number;
  energyLevel?: string;
  moodLevel?: string;
  notificationCount: number;
  snoozeCount: number;
  rescheduleCount: number;
  previousCompletionRate: number;
  timeToStartMinutes?: number;
  timeToCompletionMinutes?: number;
  deadlineDistanceHours?: number;
  focusMinutesPreceding?: number;
  outcomeTarget: 'completed_on_time' | 'completed_late' | 'postponed' | 'skipped' | 'abandoned';
}

export interface AnalyticsData {
  userId?: string;
  completedTasksCount: number;
  totalTasksCount: number;
  focusScore: number;
  deepWorkHours: number;
  totalHoursWorked: number;
  procrastinationSkipAverage: number;
  habitStreakDays: number;
  heatmap: HeatmapDay[];
  weeklyCompletion: { day: string; completed: number; postponed: number }[];
  categoryDistribution: CategoryTimeDistribution[];

  // Extended Phase 8 capabilities (optional for backward-compatibility)
  daily?: DailyAnalytics;
  weekly?: WeeklyAnalytics;
  monthly?: MonthlyAnalytics;
  heatmapGrid?: ActivityHeatmapGrid;
  energyCorrelations?: EnergyCorrelationStats[];
  reschedulingStats?: ReschedulingStats;
  kairoStats?: KairoAnalyticsStats;
  habitStreaks?: HabitStreakMetric[];
  coldStartStatus?: ColdStartStatus;
}
