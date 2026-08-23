import { Habit, HabitStreakMetric } from '@saarathi/types';

/**
 * Timezone-aware streak calculator for habits.
 * Safely computes current streak, longest streak, completion rate, missed and skipped days.
 */
export class StreakCalculator {
  /**
   * Calculate streak metric for a single habit given a history of active days
   * @param habit Habit definition
   * @param completionDates Array of ISO date strings (YYYY-MM-DD) when the habit was completed
   * @param todayDate Current date in user's timezone (YYYY-MM-DD)
   */
  public static calculateStreak(
    habit: Habit,
    completionDates: string[] = [],
    todayDate?: string
  ): HabitStreakMetric {
    const today = todayDate || new Date().toISOString().split('T')[0];
    const uniqueDates = Array.from(new Set(completionDates)).sort();

    if (uniqueDates.length === 0) {
      return {
        habitId: habit.id,
        title: habit.title,
        currentStreak: habit.streakCount || 0,
        longestStreak: habit.streakCount || 0,
        completionRate: habit.completionPercentage || 0,
        missedDays: 0,
        skippedDays: 0,
      };
    }

    const dateSet = new Set(uniqueDates);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check backwards from today or yesterday to compute current streak
    const d = new Date(today + 'T00:00:00Z');
    const todayStr = d.toISOString().split('T')[0];

    // Check if today or yesterday is completed
    const yesterdayDate = new Date(d);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let checkDate = dateSet.has(todayStr) ? new Date(d) : dateSet.has(yesterdayStr) ? yesterdayDate : null;

    if (checkDate) {
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    // Compute longest streak across all consecutive dates
    if (uniqueDates.length > 0) {
      let prevDate: Date | null = null;
      for (const dateStr of uniqueDates) {
        const curDate = new Date(dateStr + 'T00:00:00Z');
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        prevDate = curDate;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak, habit.streakCount || 0);

    // Active days rate
    const targetDaysPerWeek = habit.targetDaysPerWeek || 7;
    const activeCount = habit.activeDays ? habit.activeDays.filter(Boolean).length : 0;
    const calculatedRate = Math.min(100, Math.round((activeCount / Math.max(1, targetDaysPerWeek)) * 100));

    return {
      habitId: habit.id,
      title: habit.title,
      currentStreak,
      longestStreak,
      completionRate: calculatedRate || habit.completionPercentage || 0,
      missedDays: Math.max(0, targetDaysPerWeek - activeCount),
      skippedDays: 0,
    };
  }

  /**
   * Batch calculate streaks for all user habits
   */
  public static calculateAllHabitStreaks(habits: Habit[], todayDate?: string): HabitStreakMetric[] {
    return habits.map((h) => this.calculateStreak(h, [], todayDate));
  }
}
