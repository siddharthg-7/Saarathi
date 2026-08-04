import { create } from 'zustand';
import { Habit, Goal, SyncStatus } from '@saarathi/types';
import { createGoalDoc, subscribeToGoals, resolveConflict } from '@saarathi/api';

interface HabitGoalState {
  habits: Habit[];
  goals: Goal[];
  activeUid: string | null;

  initGoalListener: (uid: string) => () => void;
  toggleHabitDay: (habitId: string, dayIndex: number) => void;
  addHabit: (title: string, category: string, color: string) => void;
  addGoal: (goal: Goal) => Promise<void>;
}

export const useHabitGoalStore = create<HabitGoalState>((set, get) => ({
  habits: [],
  goals: [],
  activeUid: null,

  initGoalListener: (uid: string) => {
    set({ activeUid: uid });
    const unsubscribeGoals = subscribeToGoals(uid, (firestoreGoals, metadata) => {
      const currentGoals = get().goals;
      const hasPendingWrites = metadata?.hasPendingWrites ?? false;

      const mergedMap = new Map<string, Goal>();
      firestoreGoals.forEach((remoteGoal) => {
        const localGoal = currentGoals.find((g) => g.id === remoteGoal.id);
        if (localGoal && localGoal.syncStatus === 'pending') {
          const merged = resolveConflict(localGoal, remoteGoal, 'field_merge');
          mergedMap.set(merged.id, merged);
        } else {
          mergedMap.set(remoteGoal.id, {
            ...remoteGoal,
            syncStatus: (hasPendingWrites ? 'pending' : 'synced') as SyncStatus,
          });
        }
      });

      currentGoals.forEach((localGoal) => {
        if (localGoal.syncStatus === 'pending' && !mergedMap.has(localGoal.id)) {
          mergedMap.set(localGoal.id, localGoal);
        }
      });

      set({ goals: Array.from(mergedMap.values()) });
    });

    return () => unsubscribeGoals();
  },

  toggleHabitDay: (habitId, dayIndex) => {
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id === habitId) {
          const newActive = [...h.activeDays];
          newActive[dayIndex] = !newActive[dayIndex];
          const newStreak = newActive[dayIndex]
            ? h.streakCount + 1
            : Math.max(0, h.streakCount - 1);
          return {
            ...h,
            activeDays: newActive,
            streakCount: newStreak,
            version: (h.version || 1) + 1,
            syncStatus: 'pending' as SyncStatus,
          };
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
      version: 1,
      syncStatus: 'pending' as SyncStatus,
    };
    set((state) => ({ habits: [...state.habits, newHabit] }));
  },

  addGoal: async (newGoal) => {
    const { activeUid } = get();
    const formattedGoal: Goal = {
      ...newGoal,
      uid: activeUid || undefined,
      version: newGoal.version || 1,
      syncStatus: 'pending' as SyncStatus,
    };

    set((state) => ({ goals: [...state.goals, formattedGoal] }));

    if (activeUid) {
      await createGoalDoc(activeUid, formattedGoal).catch(() => {});
    }
  },
}));

