import { create } from 'zustand';
import {
  Task,
  TaskRiskPrediction,
  EnergyCluster,
  OptimalTimeSlot,
  BurnoutDetectionResponse,
  ProductivityForecastResponse,
  TaskCluster,
  TaskClusterItem,
} from '@saarathi/types';
import { mlApi } from '@saarathi/api';

export interface MLState {
  taskRiskMap: Record<string, TaskRiskPrediction>;
  energyClusters: EnergyCluster[];
  optimalSlots: OptimalTimeSlot[];
  burnoutReport: BurnoutDetectionResponse | null;
  forecast: ProductivityForecastResponse | null;
  taskClusters: TaskCluster[];
  loading: boolean;
  isColdStart: boolean;
  lastUpdated: string | null;

  // Actions
  evaluateTaskRisk: (task: Partial<Task>) => Promise<TaskRiskPrediction>;
  evaluateBatchTaskRisks: (tasks: Partial<Task>[], userId?: string, eventsCount?: number) => Promise<void>;
  fetchEnergyClusters: (userId?: string, hourlyStats?: any[], events?: any[]) => Promise<void>;
  fetchBurnoutRisk: (userId?: string, dailyStats?: any[], tasks?: any[], events?: any[]) => Promise<void>;
  fetchProductivityForecast: (userId?: string, dailyStats?: any[], forecastDays?: number) => Promise<void>;
  clusterActiveTasks: (tasks: TaskClusterItem[], numClusters?: number) => Promise<void>;
  refreshAllMLInsights: (params: {
    userId?: string;
    tasks?: Partial<Task>[];
    dailyStats?: any[];
    hourlyStats?: any[];
    events?: any[];
  }) => Promise<void>;
  reset: () => void;
}

export const useMLStore = create<MLState>((set, get) => ({
  taskRiskMap: {},
  energyClusters: [],
  optimalSlots: [],
  burnoutReport: null,
  forecast: null,
  taskClusters: [],
  loading: false,
  isColdStart: true,
  lastUpdated: null,

  reset: () =>
    set({
      taskRiskMap: {},
      energyClusters: [],
      optimalSlots: [],
      burnoutReport: null,
      forecast: null,
      taskClusters: [],
      loading: false,
      isColdStart: true,
      lastUpdated: null,
    }),

  evaluateTaskRisk: async (task: Partial<Task>) => {
    const res = await mlApi.predictTaskRisk(task);
    const prediction: TaskRiskPrediction = {
      taskId: res.taskId,
      skipProbability: res.skipProbability,
      delayProbability: res.delayProbability,
      completionProbability: res.completionProbability,
      highRisk: res.riskLevel === 'HIGH' || res.riskLevel === 'CRITICAL',
      riskLevel: (res.riskLevel?.toLowerCase() || 'medium') as any,
      contributingFactors: res.explanation ? [res.explanation] : [],
      recommendedAction: res.recommendedAction,
      isColdStart: res.isColdStart ?? true,
      explanation: res.explanationObject,
      modelMetadata: res.modelMetadata,
    };

    set((state) => ({
      taskRiskMap: {
        ...state.taskRiskMap,
        [res.taskId]: prediction,
      },
    }));

    return prediction;
  },

  evaluateBatchTaskRisks: async (tasks: Partial<Task>[], userId?: string, eventsCount?: number) => {
    if (!tasks || tasks.length === 0) return;
    set({ loading: true });
    try {
      const res = await mlApi.predictBatchRisk(tasks, userId, eventsCount);
      const newMap: Record<string, TaskRiskPrediction> = { ...get().taskRiskMap };
      res.predictions.forEach((p) => {
        newMap[p.taskId] = p;
      });
      set({
        taskRiskMap: newMap,
        isColdStart: res.isColdStart,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchEnergyClusters: async (userId?: string, hourlyStats?: any[], events?: any[]) => {
    try {
      const res = await mlApi.getEnergyClusters(userId, hourlyStats, events);
      set({
        energyClusters: res.clusters || [],
        optimalSlots: res.optimalTimeSlots || [],
        isColdStart: res.isColdStart,
      });
    } catch {
      // Handled by client fallbacks
    }
  },

  fetchBurnoutRisk: async (userId?: string, dailyStats?: any[], tasks?: any[], events?: any[]) => {
    try {
      const res = await mlApi.detectBurnoutRisk(userId, dailyStats, tasks, events);
      set({
        burnoutReport: res,
        isColdStart: res.isColdStart,
      });
    } catch {
      // Handled by client fallbacks
    }
  },

  fetchProductivityForecast: async (userId?: string, dailyStats?: any[], forecastDays = 7) => {
    try {
      const res = await mlApi.getProductivityForecast(userId, dailyStats, forecastDays);
      set({
        forecast: res,
        isColdStart: res.isColdStart,
      });
    } catch {
      // Handled by client fallbacks
    }
  },

  clusterActiveTasks: async (tasks: TaskClusterItem[], numClusters?: number) => {
    if (!tasks || tasks.length === 0) return;
    try {
      const res = await mlApi.clusterTasks(tasks, numClusters);
      set({
        taskClusters: res.clusters || [],
      });
    } catch {
      // Handled by client fallbacks
    }
  },

  refreshAllMLInsights: async ({ userId, tasks = [], dailyStats = [], hourlyStats = [], events = [] }) => {
    set({ loading: true });
    try {
      const [clusterRes, burnoutRes, forecastRes] = await Promise.allSettled([
        mlApi.getEnergyClusters(userId, hourlyStats, events),
        mlApi.detectBurnoutRisk(userId, dailyStats, tasks, events),
        mlApi.getProductivityForecast(userId, dailyStats, 7),
      ]);

      if (tasks.length > 0) {
        await get().evaluateBatchTaskRisks(tasks, userId, events.length);
        const clusterItems: TaskClusterItem[] = tasks.map((t) => ({
          id: t.id || '',
          title: t.title || '',
          category: t.category,
          tags: t.tags,
        }));
        await get().clusterActiveTasks(clusterItems);
      }

      set({
        energyClusters: clusterRes.status === 'fulfilled' ? clusterRes.value.clusters : get().energyClusters,
        optimalSlots: clusterRes.status === 'fulfilled' ? clusterRes.value.optimalTimeSlots : get().optimalSlots,
        burnoutReport: burnoutRes.status === 'fulfilled' ? burnoutRes.value : get().burnoutReport,
        forecast: forecastRes.status === 'fulfilled' ? forecastRes.value : get().forecast,
        isColdStart:
          clusterRes.status === 'fulfilled' ? clusterRes.value.isColdStart : get().isColdStart,
        lastUpdated: new Date().toISOString(),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
