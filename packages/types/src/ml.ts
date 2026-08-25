import { XAIExplanation, ModelMetadata } from './xai';

export type MLRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskRiskPrediction {
  taskId: string;
  skipProbability: number;
  delayProbability: number;
  completionProbability: number;
  highRisk: boolean;
  riskLevel: MLRiskLevel;
  contributingFactors: string[];
  recommendedAction?: string;
  isColdStart: boolean;
  explanation?: XAIExplanation;
  modelMetadata?: ModelMetadata;
}

export interface BatchRiskPredictionRequest {
  tasks: Array<{
    id: string;
    title: string;
    category?: string;
    priority?: string;
    postponeCount?: number;
    energyRequired?: string;
    difficulty?: number;
    estimatedDuration?: number;
    deadline?: string;
    createdAt?: string;
  }>;
  userId?: string;
  eventsCount?: number;
}

export interface BatchRiskPredictionResponse {
  predictions: TaskRiskPrediction[];
  highRiskCount: number;
  isColdStart: boolean;
  modelMetadata?: ModelMetadata;
}

export interface OptimalTimeSlot {
  dayOfWeek: number;
  dayName: string;
  startHour: number;
  endHour: number;
  label: string;
  energyFit: 'high' | 'medium' | 'low';
  averageProductivityScore: number;
}

export interface EnergyCluster {
  clusterId: number;
  name: string;
  hours: number[];
  averageProductivityScore: number;
  averageFocusMinutes: number;
  recommendedEnergyType: string;
}

export interface EnergyClusterResponse {
  userId: string;
  clusters: EnergyCluster[];
  optimalTimeSlots: OptimalTimeSlot[];
  dominantPeakHour: number;
  isColdStart: boolean;
}

export interface BurnoutDetectionResponse {
  userId: string;
  burnoutRiskScore: number;
  anomalyDetected: boolean;
  riskLevel: 'low' | 'moderate' | 'high';
  contributingIndicators: string[];
  workloadTrend: 'increasing' | 'stable' | 'decreasing';
  recommendations: string[];
  isColdStart: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayOfWeek: number;
  dayName: string;
  predictedTasksCompleted: number;
  predictedFocusMinutes: number;
  confidenceLower: number;
  confidenceUpper: number;
}

export interface ProductivityForecastResponse {
  userId: string;
  forecastDays: DailyForecastItem[];
  expectedWeeklyCompleted: number;
  expectedWeeklyFocusMinutes: number;
  trendDirection: 'upward' | 'steady' | 'downward';
  isColdStart: boolean;
}

export interface TaskClusterItem {
  id: string;
  title: string;
  category?: string;
  tags?: string[];
}

export interface TaskCluster {
  clusterId: number;
  topicName: string;
  keywords: string[];
  taskIds: string[];
  taskCount: number;
}

export interface TaskSemanticClusterResponse {
  clusters: TaskCluster[];
  totalTasks: number;
}
