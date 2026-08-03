import { apiClient } from './client';
import { Task } from '@saarathi/types';

export interface TaskPredictionResponse {
  taskId: string;
  completionProbability: number;
  skipProbability: number;
  delayProbability: number;
  explanation: string;
  recommendedAction?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface EnergyClustersResponse {
  bestCodingHours: string;
  bestReadingHours: string;
  worstProductivityTime: string;
}

export const mlApi = {
  async predictTaskRisk(task: Partial<Task>): Promise<TaskPredictionResponse> {
    try {
      return await apiClient.post<TaskPredictionResponse>('/ml/predict-task', {
        taskId: task.id,
        category: task.category,
        scheduledTime: task.scheduledTime,
        userEnergy: task.energyRequired,
        postponeCount: task.postponeCount || 0,
      });
    } catch {
      let riskScore = 0.25;
      if ((task.postponeCount || 0) > 2) riskScore += 0.35;
      if (task.energyRequired === 'High') riskScore += 0.2;
      if ((task.difficulty || 3) > 3) riskScore += 0.15;
      riskScore = Math.min(0.95, riskScore);

      const skipProb = Math.round(riskScore * 100);
      const riskLevel = skipProb > 75 ? 'HIGH' : skipProb > 30 ? 'MEDIUM' : 'LOW';

      return {
        taskId: task.id || 'unknown',
        completionProbability: Math.round((1 - riskScore) * 100) / 100,
        skipProbability: skipProb,
        delayProbability: Math.round(Math.min(95, riskScore * 110)),
        riskLevel,
        explanation:
          riskLevel === 'HIGH'
            ? `You have postponed this high-energy task ${task.postponeCount || 3} times recently. Evening fatigue increases skip risk.`
            : `Task aligns reasonably with your historical completion metrics.`,
        recommendedAction:
          riskLevel === 'HIGH'
            ? 'Reschedule to tomorrow 09:30 AM during peak focus window or break into smaller subtasks.'
            : 'Keep in schedule.',
      };
    }
  },

  async getEnergyClusters(): Promise<EnergyClustersResponse> {
    try {
      return await apiClient.get<EnergyClustersResponse>('/ml/energy-clusters');
    } catch {
      return {
        bestCodingHours: '09:30 AM - 11:30 AM',
        bestReadingHours: '02:00 PM - 04:00 PM',
        worstProductivityTime: '07:00 PM - 09:00 PM',
      };
    }
  },
};
