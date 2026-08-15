import { create } from 'zustand';
import {
  Task,
  TaskStatus,
  EnergyLevel,
  TaskPriority,
  RecurrencePattern,
  Subtask,
  TaskFilterState,
  Project,
  SyncStatus,
} from '@saarathi/types';
import { initialTasks } from './data/initialData';
import {
  telemetryApi,
  mlApi,
  createTaskDoc,
  updateTaskDoc,
  deleteTaskDoc,
  reorderTasksBatch,
  subscribeToTasks,
  subscribeToProjects,
  createProjectDoc,
  deleteProjectDoc,
  resolveConflict,
} from '@saarathi/api';


interface TaskState {
  tasks: Task[];
  projects: Project[];
  filter: TaskFilterState;
  isLoading: boolean;
  activeUid: string | null;

  // Real-time Firestore sync
  initTaskListener: (uid: string) => () => void;

  // Task Actions (Optimistic UI)
  addTask: (
    titleOrParams:
      | string
      | {
          title: string;
          category: string;
          energyRequired: EnergyLevel;
          priority?: TaskPriority;
          deadline?: string;
          scheduledTime?: string;
          projectId?: string;
          projectName?: string;
          goalId?: string;
          recurrence?: RecurrencePattern;
          tags?: string[];
        },
    category?: string,
    energyRequired?: EnergyLevel
  ) => Promise<void>;

  toggleTaskComplete: (taskId: string) => Promise<void>;
  postponeTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Subtask Actions
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Drag and drop reorder
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>;

  // Projects
  addProject: (title: string, color: string, description?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Search & Filter Actions
  setFilter: (filter: Partial<TaskFilterState>) => void;
  resetFilter: () => void;
  getFilteredTasks: () => Task[];
}

const initialFilter: TaskFilterState = {
  searchQuery: '',
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: initialTasks,
  projects: [],
  filter: initialFilter,
  isLoading: false,
  activeUid: null,

  initTaskListener: (uid: string) => {
    set({ activeUid: uid, isLoading: true });
    const unsubscribeTasks = subscribeToTasks(uid, (firestoreTasks, metadata) => {
      const currentTasks = get().tasks;
      const hasPendingWrites = metadata?.hasPendingWrites ?? false;

      const mergedMap = new Map<string, Task>();

      firestoreTasks.forEach((remoteTask) => {
        const localTask = currentTasks.find((t) => t.id === remoteTask.id);
        if (localTask && localTask.syncStatus === 'pending') {
          const merged = resolveConflict(localTask, remoteTask, 'field_merge');
          mergedMap.set(merged.id, merged);
        } else {
          mergedMap.set(remoteTask.id, {
            ...remoteTask,
            syncStatus: (hasPendingWrites ? 'pending' : 'synced') as SyncStatus,
          });
        }
      });

      currentTasks.forEach((localTask) => {
        if (localTask.syncStatus === 'pending' && !mergedMap.has(localTask.id)) {
          mergedMap.set(localTask.id, localTask);
        }
      });

      const mergedTasks = Array.from(mergedMap.values()).sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
      );

      set({ tasks: mergedTasks, isLoading: false });
    });

    const unsubscribeProjects = subscribeToProjects(uid, (firestoreProjects, metadata) => {
      const currentProjects = get().projects;
      const hasPendingWrites = metadata?.hasPendingWrites ?? false;

      const mergedMap = new Map<string, Project>();
      firestoreProjects.forEach((remoteProj) => {
        const localProj = currentProjects.find((p) => p.id === remoteProj.id);
        if (localProj && localProj.syncStatus === 'pending') {
          const merged = resolveConflict(localProj, remoteProj, 'field_merge');
          mergedMap.set(merged.id, merged);
        } else {
          mergedMap.set(remoteProj.id, {
            ...remoteProj,
            syncStatus: (hasPendingWrites ? 'pending' : 'synced') as SyncStatus,
          });
        }
      });

      currentProjects.forEach((localProj) => {
        if (localProj.syncStatus === 'pending' && !mergedMap.has(localProj.id)) {
          mergedMap.set(localProj.id, localProj);
        }
      });

      set({ projects: Array.from(mergedMap.values()) });
    });

    return () => {
      unsubscribeTasks();
      unsubscribeProjects();
    };
  },

  addTask: async (titleOrParams, categoryArg, energyRequiredArg) => {
    const { activeUid, tasks } = get();
    const taskId = `task_${Date.now()}`;
    const nextOrderIndex = tasks.length ? Math.max(...tasks.map((t) => t.orderIndex || 0)) + 1 : 0;

    let title: string;
    let category: string;
    let energyRequired: EnergyLevel;
    let priority: TaskPriority = 'Medium';
    let deadline: string | undefined;
    let scheduledTime: string = '02:00 PM';
    let projectId: string | undefined;
    let projectName: string | undefined;
    let goalId: string | undefined;
    let recurrence: RecurrencePattern = 'none';
    let tags: string[] = [];

    if (typeof titleOrParams === 'string') {
      title = titleOrParams;
      category = categoryArg || 'General';
      energyRequired = energyRequiredArg || 'Medium';
      tags = [category];
    } else {
      title = titleOrParams.title;
      category = titleOrParams.category;
      energyRequired = titleOrParams.energyRequired;
      priority = titleOrParams.priority || 'Medium';
      deadline = titleOrParams.deadline;
      scheduledTime = titleOrParams.scheduledTime || '02:00 PM';
      projectId = titleOrParams.projectId;
      projectName = titleOrParams.projectName;
      goalId = titleOrParams.goalId;
      recurrence = titleOrParams.recurrence || 'none';
      tags = titleOrParams.tags || [category];
    }

    const newTask: Task = {
      id: taskId,
      uid: activeUid || undefined,
      title,
      estimatedDuration: 45,
      energyRequired,
      category,
      priority,
      difficulty: 3,
      urgency: 'Medium',
      status: 'pending',
      aiSummary: 'Added to task list.',
      skipProbability: 15,
      delayProbability: 20,
      postponeCount: 0,
      scheduledTime,
      deadline,
      tags,
      context: 'Home',
      subtasks: [],
      projectId,
      projectName,
      goalId,
      recurrence,
      orderIndex: nextOrderIndex,
      createdAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'pending' as SyncStatus,
    };

    // Optimistic local update
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    telemetryApi.logEvent({ taskId: newTask.id, eventType: 'CREATED' });

    // Sync to Firestore if authenticated
    if (activeUid) {
      try {
        await createTaskDoc(activeUid, newTask);
      } catch (err) {
        console.error('Failed to create task doc in Firestore:', err);
      }
    }
  },

  toggleTaskComplete: async (taskId) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextStatus: TaskStatus = targetTask.status === 'completed' ? 'pending' : 'completed';
    const currentVersion = targetTask.version || 1;

    let newRecurringTask: Task | null = null;
    if (nextStatus === 'completed' && targetTask.recurrence && targetTask.recurrence !== 'none') {
      const nextTaskId = `task_${Date.now()}`;
      newRecurringTask = {
        ...targetTask,
        id: nextTaskId,
        status: 'pending',
        postponeCount: 0,
        createdAt: new Date().toISOString(),
        orderIndex: Math.max(...tasks.map((t) => t.orderIndex || 0)) + 1,
        version: 1,
        syncStatus: 'pending' as SyncStatus,
      };
    }

    // Optimistic UI update
    set((state) => ({
      tasks: state.tasks
        .map((t) =>
          t.id === taskId
            ? { ...t, status: nextStatus, version: currentVersion + 1, syncStatus: 'pending' as SyncStatus }
            : t
        )
        .concat(newRecurringTask ? [newRecurringTask] : []),
    }));

    telemetryApi.logEvent({
      taskId,
      eventType: nextStatus === 'completed' ? 'COMPLETED' : 'POSTPONED',
    });

    if (activeUid) {
      try {
        await updateTaskDoc(activeUid, taskId, { status: nextStatus }, currentVersion);
        if (newRecurringTask) {
          await createTaskDoc(activeUid, newRecurringTask);
        }
      } catch (err) {
        console.error('Failed to update task completion in Firestore:', err);
      }
    }
  },

  postponeTask: async (taskId) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentVersion = targetTask.version || 1;
    const nextPostponeCount = targetTask.postponeCount + 1;
    const prediction = await mlApi.predictTaskRisk({
      ...targetTask,
      postponeCount: nextPostponeCount,
    });

    const updates: Partial<Task> = {
      postponeCount: nextPostponeCount,
      skipProbability: prediction.skipProbability,
      delayProbability: prediction.delayProbability,
      status: 'skipped',
      scheduledTime: 'Tomorrow 07:00 AM',
      version: currentVersion + 1,
      syncStatus: 'pending' as SyncStatus,
    };

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    }));

    telemetryApi.logEvent({
      taskId,
      eventType: 'POSTPONED',
      currentPostponeCount: nextPostponeCount,
    });

    if (activeUid) {
      try {
        await updateTaskDoc(activeUid, taskId, updates, currentVersion);
      } catch (err) {
        console.error('Failed to postpone task in Firestore:', err);
      }
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    const currentVersion = targetTask?.version || 1;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status, version: currentVersion + 1, syncStatus: 'pending' as SyncStatus }
          : t
      ),
    }));
    if (activeUid) {
      await updateTaskDoc(activeUid, taskId, { status }, currentVersion).catch(() => {});
    }
  },

  updateTask: async (taskId, updates) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    const currentVersion = targetTask?.version || 1;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, ...updates, version: currentVersion + 1, syncStatus: 'pending' as SyncStatus }
          : t
      ),
    }));
    if (activeUid) {
      await updateTaskDoc(activeUid, taskId, updates, currentVersion).catch(() => {});
    }
  },

  deleteTask: async (taskId) => {
    const { activeUid } = get();
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
    telemetryApi.logEvent({ taskId, eventType: 'DELETED' });

    if (activeUid) {
      await deleteTaskDoc(activeUid, taskId).catch(() => {});
    }
  },

  addSubtask: async (taskId, title) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentVersion = targetTask.version || 1;
    const newSubtask: Subtask = {
      id: `sub_${Date.now()}`,
      title,
      completed: false,
    };
    const updatedSubtasks = [...targetTask.subtasks, newSubtask];

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              version: currentVersion + 1,
              syncStatus: 'pending',
            }
          : t
      ),
    }));

    if (activeUid) {
      await updateTaskDoc(
        activeUid,
        taskId,
        { subtasks: updatedSubtasks },
        currentVersion
      ).catch(() => {});
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentVersion = targetTask.version || 1;
    const updatedSubtasks = targetTask.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              version: currentVersion + 1,
              syncStatus: 'pending',
            }
          : t
      ),
    }));

    if (activeUid) {
      await updateTaskDoc(
        activeUid,
        taskId,
        { subtasks: updatedSubtasks },
        currentVersion
      ).catch(() => {});
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const { tasks, activeUid } = get();
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentVersion = targetTask.version || 1;
    const updatedSubtasks = targetTask.subtasks.filter((st) => st.id !== subtaskId);

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              version: currentVersion + 1,
              syncStatus: 'pending',
            }
          : t
      ),
    }));

    if (activeUid) {
      await updateTaskDoc(
        activeUid,
        taskId,
        { subtasks: updatedSubtasks },
        currentVersion
      ).catch(() => {});
    }
  },

  reorderTasks: async (reorderedTasks) => {
    const { activeUid } = get();
    const indexed = reorderedTasks.map((t, idx) => ({
      ...t,
      orderIndex: idx,
      version: (t.version || 1) + 1,
      syncStatus: 'pending' as const,
    }));
    set({ tasks: indexed });

    if (activeUid) {
      await reorderTasksBatch(
        activeUid,
        indexed.map((t) => ({ id: t.id, orderIndex: t.orderIndex }))
      ).catch(() => {});
    }
  },

  addProject: async (title, color, description) => {
    const { activeUid } = get();
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      uid: activeUid || undefined,
      title,
      color,
      description: description || '',
      createdAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'pending',
    };
    set((state) => ({ projects: [...state.projects, newProject] }));

    if (activeUid) {
      await createProjectDoc(activeUid, newProject).catch(() => {});
    }
  },

  deleteProject: async (projectId) => {
    const { activeUid } = get();
    set((state) => ({ projects: state.projects.filter((p) => p.id !== projectId) }));
    if (activeUid) {
      await deleteProjectDoc(activeUid, projectId).catch(() => {});
    }
  },

  setFilter: (partialFilter) =>
    set((state) => ({
      filter: { ...state.filter, ...partialFilter },
    })),

  resetFilter: () => set({ filter: initialFilter }),

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    return tasks.filter((task) => {
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesCategory = task.category.toLowerCase().includes(query);
        const matchesTag = task.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCategory && !matchesTag) return false;
      }
      if (filter.category && task.category !== filter.category) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.status && task.status !== filter.status) return false;
      if (filter.projectId && task.projectId !== filter.projectId) return false;
      if (filter.goalId && task.goalId !== filter.goalId) return false;
      if (filter.tag && !task.tags.includes(filter.tag)) return false;
      return true;
    });
  },
}));
