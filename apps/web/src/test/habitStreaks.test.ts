import { describe, it, expect } from 'vitest';
import { StreakCalculator } from '@saarathi/api';
import { Habit } from '@saarathi/types';

describe('StreakCalculator Habit Streak Calculations', () => {
  const baseHabit: Habit = {
    id: 'hab_cold_shower',
    title: 'Morning Cold Shower',
    category: 'Health',
    streakCount: 5,
    completionPercentage: 80,
    bestDay: 'Wednesday',
    activeDays: [true, true, true, true, true, false, false],
    targetDaysPerWeek: 7,
    color: '#10B981',
  };

  it('should compute current streak when dates are consecutive leading up to today', () => {
    const dates = ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23'];
    const metric = StreakCalculator.calculateStreak(baseHabit, dates, '2026-08-23');

    expect(metric.currentStreak).toBe(4);
    expect(metric.longestStreak).toBe(5); // Respects historical max
    expect(metric.completionRate).toBeGreaterThan(0);
  });

  it('should handle streak when completed up to yesterday but not yet today', () => {
    const dates = ['2026-08-20', '2026-08-21', '2026-08-22'];
    const metric = StreakCalculator.calculateStreak(baseHabit, dates, '2026-08-23');

    // Should count streak from yesterday (not broken yet)
    expect(metric.currentStreak).toBe(3);
  });

  it('should reset current streak to 0 if missed both today and yesterday', () => {
    const dates = ['2026-08-15', '2026-08-16', '2026-08-17'];
    const metric = StreakCalculator.calculateStreak(baseHabit, dates, '2026-08-23');

    expect(metric.currentStreak).toBe(0);
    expect(metric.longestStreak).toBe(5); // Preserves longest streak
  });

  it('should handle batch streak calculations for all habits', () => {
    const habits: Habit[] = [
      baseHabit,
      {
        id: 'hab_read',
        title: 'Read Book',
        category: 'Personal',
        streakCount: 12,
        completionPercentage: 90,
        bestDay: 'Sunday',
        activeDays: [true, true, true, true, true, true, true],
        targetDaysPerWeek: 7,
        color: '#F59E0B',
      },
    ];

    const allMetrics = StreakCalculator.calculateAllHabitStreaks(habits, '2026-08-23');
    expect(allMetrics.length).toBe(2);
    expect(allMetrics[0].habitId).toBe('hab_cold_shower');
    expect(allMetrics[1].habitId).toBe('hab_read');
  });
});
