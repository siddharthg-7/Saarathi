import { create } from 'zustand';
import { Habit, Goal } from '@saarathi/types';
import { initialHabits, initialGoals } from '@/data/initialData';

interface HabitGoalState {
  habits: Habit[];
  goals: Goal[];
  toggleHabitDay: (habitId: string, dayIndex: number) => void;
  addHabit: (title: string, category: string, color: string) => void;
  addGoal: (goal: Goal) => void;
}

export const useHabitGoalStore = create<HabitGoalState>((set) => ({
  habits: initialHabits,
  goals: initialGoals,

  toggleHabitDay: (habitId, dayIndex) => {
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id === habitId) {
          const newActive = [...h.activeDays];
          newActive[dayIndex] = !newActive[dayIndex];
          const newStreak = newActive[dayIndex]
            ? h.streakCount + 1
            : Math.max(0, h.streakCount - 1);
          return { ...h, activeDays: newActive, streakCount: newStreak };
        }
        return h;
      }),
    }));
  },

  addHabit: (title, category, color) => {
    const newHabit: Habit = {
      id: `hab_${Date.now()}`,
      title,
      category,
      streakCount: 1,
      completionPercentage: 100,
      bestDay: 'Monday',
      activeDays: [true, false, false, false, false, false, false],
      targetDaysPerWeek: 7,
      color,
    };
    set((state) => ({ habits: [...state.habits, newHabit] }));
  },

  addGoal: (newGoal) => {
    set((state) => ({ goals: [...state.goals, newGoal] }));
  },
}));
