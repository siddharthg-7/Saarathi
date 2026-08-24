import { apiClient } from './client';
import {
  Task,
  TaskRiskPrediction,
  BatchRiskPredictionResponse,
  EnergyClusterResponse,
  BurnoutDetectionResponse,
  ProductivityForecastResponse,
  TaskSemanticClusterResponse,
  TaskClusterItem,
} from '@saarathi/types';

export interface TaskPredictionResponse {
  taskId: string;
  completionProbability: number;
  skipProbability: number;
  delayProbability: number;
  explanation: string;
  recommendedAction?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isColdStart?: boolean;
}

export interface EnergyClustersResponse {
  bestCodingHours: string;
  bestReadingHours: string;
  worstProductivityTime: string;
  clusters?: EnergyClusterResponse['clusters'];
  optimalSlots?: EnergyClusterResponse['optimalTimeSlots'];
}

export const mlApi = {
  /**
   * Predict single task procrastination and delay risk with ML / cold-start heuristic fallback
   */
  async predictTaskRisk(task: Partial<Task>): Promise<TaskPredictionResponse> {
    try {
      const response = await apiClient.post<TaskRiskPrediction>('/ml/predict-risk', {
        id: task.id || 'task_unknown',
        title: task.title || 'Untitled Task',
        category: task.category || 'General',
        priority: task.priority || 'Medium',
        postponeCount: task.postponeCount || 0,
        energyRequired: task.energyRequired || 'Medium',
        estimatedDuration: task.estimatedDuration || 30,
        deadline: task.deadline,
        createdAt: task.createdAt,
      });

      const mappedRiskLevel = (response.riskLevel?.toUpperCase() || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      const explanation = response.contributingFactors?.length
        ? response.contributingFactors.join('. ')
        : 'Task evaluated against standard workload indicators.';

      return {
        taskId: response.taskId,
        completionProbability: response.completionProbability,
        skipProbability: response.skipProbability,
        delayProbability: response.delayProbability,
        explanation,
        recommendedAction: response.recommendedAction,
        riskLevel: mappedRiskLevel,
        isColdStart: response.isColdStart,
      };
    } catch {
      let riskScore = 0.25;
      const postpone = task.postponeCount || 0;
      if (postpone > 2) riskScore += 0.35;
      else if (postpone > 0) riskScore += 0.2;
      if (task.energyRequired === 'High') riskScore += 0.15;
      if (task.priority === 'Critical' || (task.priority as string) === 'Urgent') riskScore += 0.15;
      riskScore = Math.min(0.95, riskScore);

      const skipProb = Math.round(riskScore * 100);
      const riskLevel = skipProb > 75 ? 'HIGH' : skipProb > 40 ? 'MEDIUM' : 'LOW';

      return {
        taskId: task.id || 'unknown',
        completionProbability: Math.round((1 - riskScore) * 100),
        skipProbability: skipProb,
        delayProbability: Math.min(95, Math.round(riskScore * 105)),
        riskLevel,
        explanation:
          riskLevel === 'HIGH'
            ? `Postponed ${postpone} times. Late scheduled time increases postponement probability.`
            : `Task aligns reasonably with historical baseline metrics.`,
        recommendedAction:
          riskLevel === 'HIGH'
            ? 'Reschedule to morning peak focus window (09:00 - 12:00) or divide into 20m subtasks.'
            : 'Keep in schedule.',
        isColdStart: true,
      };
    }
  },

  /**
   * Predict risk for a batch of tasks
   */
  async predictBatchRisk(
    tasks: Partial<Task>[],
    userId?: string,
    eventsCount?: number
  ): Promise<BatchRiskPredictionResponse> {
    try {
      const payloadTasks = tasks.map((t) => ({
        id: t.id || 'task_unknown',
        title: t.title || 'Untitled Task',
        category: t.category || 'General',
        priority: t.priority || 'Medium',
        postponeCount: t.postponeCount || 0,
        energyRequired: t.energyRequired || 'Medium',
        estimatedDuration: t.estimatedDuration || 30,
        deadline: t.deadline,
        createdAt: t.createdAt,
      }));

      return await apiClient.post<BatchRiskPredictionResponse>('/ml/predict-batch-risk', {
        tasks: payloadTasks,
        userId,
        eventsCount,
      });
    } catch {
      const predictions: TaskRiskPrediction[] = tasks.map((t) => {
        const postpone = t.postponeCount || 0;
        const skip = Math.min(95, postpone * 22 + 15);
        const delay = Math.min(95, postpone * 18 + 20);
        const highRisk = postpone >= 1 || skip >= 50;
        return {
          taskId: t.id || 'unknown',
          skipProbability: skip,
          delayProbability: delay,
          completionProbability: Math.max(5, 100 - delay),
          highRisk,
          riskLevel: highRisk ? 'high' : 'medium',
          contributingFactors: postpone > 0 ? [`Postponed ${postpone} time(s)`] : ['Standard baseline task'],
          recommendedAction: highRisk ? 'Schedule for morning deep focus' : 'On track',
          isColdStart: true,
        };
      });

      return {
        predictions,
        highRiskCount: predictions.filter((p) => p.highRisk).length,
        isColdStart: true,
      };
    }
  },

  /**
   * Get K-Means energy clusters and optimal time slots
   */
  async getEnergyClusters(
    userId?: string,
    hourlyStats?: any[],
    events?: any[]
  ): Promise<EnergyClusterResponse> {
    try {
      return await apiClient.post<EnergyClusterResponse>('/ml/cluster-energy', {
        userId,
        hourlyStats,
        events,
      });
    } catch {
      return {
        userId: userId || 'default_user',
        clusters: [
          {
            clusterId: 1,
            name: 'Peak Deep Work',
            hours: [9, 10, 11, 12],
            averageProductivityScore: 88,
            averageFocusMinutes: 45,
            recommendedEnergyType: 'High',
          },
          {
            clusterId: 2,
            name: 'Afternoon Execution',
            hours: [14, 15, 16, 17, 18],
            averageProductivityScore: 72,
            averageFocusMinutes: 32,
            recommendedEnergyType: 'Medium',
          },
          {
            clusterId: 3,
            name: 'Low Energy & Admin',
            hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 19, 20, 21, 22, 23],
            averageProductivityScore: 35,
            averageFocusMinutes: 12,
            recommendedEnergyType: 'Low',
          },
        ],
        optimalTimeSlots: [
          {
            dayOfWeek: 1,
            dayName: 'Monday',
            startHour: 9,
            endHour: 12,
            label: 'Morning Peak Deep Focus',
            energyFit: 'high',
            averageProductivityScore: 88,
          },
          {
            dayOfWeek: 1,
            dayName: 'Monday',
            startHour: 14,
            endHour: 17,
            label: 'Afternoon Task Execution',
            energyFit: 'medium',
            averageProductivityScore: 74,
          },
        ],
        dominantPeakHour: 10,
        isColdStart: true,
      };
    }
  },

  /**
   * Detect burnout and workload anomalies using Isolation Forest
   */
  async detectBurnoutRisk(
    userId?: string,
    recentDailyStats?: any[],
    recentTasks?: any[],
    recentEvents?: any[]
  ): Promise<BurnoutDetectionResponse> {
    try {
      return await apiClient.post<BurnoutDetectionResponse>('/ml/detect-burnout', {
        userId,
        recentDailyStats,
        recentTasks,
        recentEvents,
      });
    } catch {
      return {
        userId: userId || 'default_user',
        burnoutRiskScore: 22,
        anomalyDetected: false,
        riskLevel: 'low',
        contributingIndicators: ['Balanced focus workload within baseline range'],
        workloadTrend: 'stable',
        recommendations: ['Maintain standard 5-minute break pacing between Pomodoro sessions'],
        isColdStart: true,
      };
    }
  },

  /**
   * Get 7-day rolling productivity and velocity forecast
   */
  async getProductivityForecast(
    userId?: string,
    historicalDailyStats?: any[],
    forecastDaysCount: number = 7
  ): Promise<ProductivityForecastResponse> {
    try {
      return await apiClient.post<ProductivityForecastResponse>('/ml/forecast-productivity', {
        userId,
        historicalDailyStats,
        forecastDaysCount,
      });
    } catch {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const forecastDays = Array.from({ length: forecastDaysCount }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        const dow = d.getDay();
        const isWeekend = dow === 0 || dow === 6;
        return {
          date: d.toISOString().split('T')[0],
          dayOfWeek: dow === 0 ? 7 : dow,
          dayName: days[dow === 0 ? 6 : dow - 1],
          predictedTasksCompleted: isWeekend ? 2 : 5,
          predictedFocusMinutes: isWeekend ? 60 : 140,
          confidenceLower: 0.75,
          confidenceUpper: 0.90,
        };
      });

      return {
        userId: userId || 'default_user',
        forecastDays,
        expectedWeeklyCompleted: 29,
        expectedWeeklyFocusMinutes: 820,
        trendDirection: 'steady',
        isColdStart: true,
      };
    }
  },

  /**
   * Semantic topic clustering for active tasks
   */
  async clusterTasks(
    tasks: TaskClusterItem[],
    numClusters?: number
  ): Promise<TaskSemanticClusterResponse> {
    try {
      return await apiClient.post<TaskSemanticClusterResponse>('/ml/cluster-tasks', {
        tasks,
        numClusters,
      });
    } catch {
      const catMap: Record<string, string[]> = {};
      tasks.forEach((t) => {
        const cat = t.category || 'General';
        if (!catMap[cat]) catMap[cat] = [];
        catMap[cat].push(t.id);
      });

      const clusters = Object.entries(catMap).map(([cat, ids], i) => ({
        clusterId: i + 1,
        topicName: `${cat} Focus Area`,
        keywords: [cat.toLowerCase()],
        taskIds: ids,
        taskCount: ids.length,
      }));

      return {
        clusters,
        totalTasks: tasks.length,
      };
    }
  },
};
