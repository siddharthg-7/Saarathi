import { describe, it, expect, beforeEach } from 'vitest';
import { useHabitGoalStore } from '@saarathi/store';
import { Goal } from '@saarathi/types';

describe('useHabitGoalStore', () => {
  beforeEach(() => {
    // Reset store state
    useHabitGoalStore.setState({
      habits: [
        {
          id: 'habit-1',
          title: 'Daily Meditation',
          category: 'Mindfulness',
          streakCount: 5,
          completionPercentage: 80,
          bestDay: 'Monday',
          activeDays: [true, true, true, true, true, false, false],
          targetDaysPerWeek: 7,
          color: '#10B981',
        },
      ],
      goals: [],
      activeUid: null, // Keep null for offline in-memory unit tests
    });
  });

  it('should toggle habit day completion status and recalculate streak', () => {
    const { toggleHabitDay } = useHabitGoalStore.getState();

    // Toggle day 5 (0-indexed Friday) to true
    toggleHabitDay('habit-1', 5);

    const updatedHabit = useHabitGoalStore.getState().habits.find((h) => h.id === 'habit-1');
    expect(updatedHabit?.activeDays[5]).toBe(true);
    expect(updatedHabit?.streakCount).toBe(6);

    // Toggle day 5 back to false
    toggleHabitDay('habit-1', 5);
    const toggledOff = useHabitGoalStore.getState().habits.find((h) => h.id === 'habit-1');
    expect(toggledOff?.activeDays[5]).toBe(false);
    expect(toggledOff?.streakCount).toBe(5);
  });

  it('should add a new habit with 7-day initial active array', () => {
    const { addHabit } = useHabitGoalStore.getState();
    addHabit('Cold Shower', 'Health', '#3B82F6');

    const habits = useHabitGoalStore.getState().habits;
    const newHabit = habits.find((h) => h.title === 'Cold Shower');
    expect(newHabit).toBeDefined();
    expect(newHabit?.streakCount).toBe(1);
    expect(newHabit?.activeDays.length).toBe(7);
    expect(newHabit?.activeDays[0]).toBe(true);
  });

  it('should add a new goal optimistically', async () => {
    const { addGoal } = useHabitGoalStore.getState();
    const newGoal: Goal = {
      id: 'goal-101',
      title: 'Launch SaaS Platform',
      description: 'Finish all 16 phases',
      category: 'Business',
      status: 'in_progress',
      targetDate: '2026-12-31',
      dailyTasksCount: 3,
      milestones: [
        { id: 'm1', title: 'Beta Testing', targetWeeks: '2 weeks', progress: 100, completed: true },
        { id: 'm2', title: 'Payment Integration', targetWeeks: '4 weeks', progress: 0, completed: false },
      ],
    };

    await addGoal(newGoal);

    const goals = useHabitGoalStore.getState().goals;
    const added = goals.find((g) => g.id === 'goal-101');
    expect(added).toBeDefined();
    expect(added?.title).toBe('Launch SaaS Platform');
    expect(added?.syncStatus).toBe('pending');
  });
});
