import { create } from 'zustand';
import { Task, TaskStatus, EnergyLevel } from '@saarathi/types';
import { initialTasks } from '@/data/initialData';
import { telemetryApi } from '@saarathi/api';
import { mlApi } from '@saarathi/api';

interface TaskState {
  tasks: Task[];
  addTask: (title: string, category: string, energyRequired: EnergyLevel) => void;
  toggleTaskComplete: (taskId: string) => void;
  postponeTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: initialTasks,

  addTask: (title, category, energyRequired) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title,
      estimatedDuration: 45,
      energyRequired,
      category,
      difficulty: 3,
      urgency: 'Medium',
      status: 'pending',
      aiSummary: 'Added to schedule by user.',
      skipProbability: 15,
      delayProbability: 20,
      postponeCount: 0,
      scheduledTime: '02:00 PM',
      tags: [category],
      context: 'Home',
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    telemetryApi.logEvent({ taskId: newTask.id, eventType: 'CREATED' });
  },

  toggleTaskComplete: (taskId) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus: TaskStatus = t.status === 'completed' ? 'pending' : 'completed';
          telemetryApi.logEvent({
            taskId,
            eventType: nextStatus === 'completed' ? 'COMPLETED' : 'POSTPONED',
          });
          return { ...t, status: nextStatus };
        }
        return t;
      });
      return { tasks: updatedTasks };
    });
  },

  postponeTask: async (taskId) => {
    const targetTask = get().tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextPostponeCount = targetTask.postponeCount + 1;
    const prediction = await mlApi.predictTaskRisk({
      ...targetTask,
      postponeCount: nextPostponeCount,
    });

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            postponeCount: nextPostponeCount,
            skipProbability: prediction.skipProbability,
            delayProbability: prediction.delayProbability,
            status: 'skipped',
            scheduledTime: 'Tomorrow 07:00 AM',
          };
        }
        return t;
      }),
    }));

    telemetryApi.logEvent({
      taskId,
      eventType: 'POSTPONED',
      currentPostponeCount: nextPostponeCount,
    });
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
    telemetryApi.logEvent({ taskId, eventType: 'DELETED' });
  },
}));
