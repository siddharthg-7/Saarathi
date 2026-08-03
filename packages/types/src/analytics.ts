export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface AnalyticsData {
  completedTasksCount: number;
  totalTasksCount: number;
  focusScore: number;
  deepWorkHours: number;
  totalHoursWorked: number;
  procrastinationSkipAverage: number;
  habitStreakDays: number;
  heatmap: HeatmapDay[];
  weeklyCompletion: { day: string; completed: number; postponed: number }[];
  categoryDistribution: { category: string; count: number; color: string }[];
}
