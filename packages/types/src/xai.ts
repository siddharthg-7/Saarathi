export type ContributionDirection = 'positive' | 'negative' | 'neutral';

export type ContributionStrength =
  | 'strong_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'strong_negative';

export type ExplanationQuality =
  | 'insufficient_data'
  | 'limited_evidence'
  | 'moderate_evidence'
  | 'strong_evidence';

export interface FeatureContributor {
  feature: string;
  displayName: string;
  value: any;
  rawContribution: number;
  normalizedContribution: number;
  direction: ContributionDirection;
  strength: ContributionStrength;
  importanceRank: number;
  description?: string;
}

export interface BehavioralEvidence {
  fact: string;
  metric: string;
  value: any;
  sampleSize: number;
  timeWindow?: string;
  baselineComparison?: string;
  isStatisticallySignificant: boolean;
}

export interface ModelMetadata {
  modelName: string;
  modelVersion: string;
  featureVersion: string;
  explanationMethod: string;
  generatedAt?: string;
}

export interface XAIExplanation {
  explanationId: string;
  taskId: string;
  summary: string;
  predictionType: string;
  probability: number;
  quality: ExplanationQuality;
  qualityReason?: string;
  contributors: FeatureContributor[];
  evidence: BehavioralEvidence[];
  modelMetadata: ModelMetadata;
  isColdStart: boolean;
  isFallback: boolean;
  naturalLanguageExplanation?: string;
}

export interface ScheduleTimeSlot {
  date: string;
  time: string;
  startHour: number;
  endHour: number;
  predictedCompletion: number;
}

export interface ScheduleRecommendation {
  recommendationId: string;
  taskId: string;
  currentSchedule: ScheduleTimeSlot;
  recommendedSchedule: ScheduleTimeSlot;
  predictedImprovement: number;
  reason: string;
  explanationQuality: ExplanationQuality;
  contributors: FeatureContributor[];
  evidence: BehavioralEvidence[];
  modelMetadata: ModelMetadata;
  generatedAt: string;
}

export interface ScheduleRecommendationResponse {
  recommendation: ScheduleRecommendation;
  autoApplyEnabled: boolean;
}

export interface FeatureMetadata {
  feature: string;
  displayName: string;
  category: string;
  description: string;
  unit?: string;
  format?: string;
  positiveMeaning?: string;
  negativeMeaning?: string;
  privacyLevel: string;
}

export interface FeatureRegistryResponse {
  features: FeatureMetadata[];
  count: number;
  version: string;
}

export interface XAITelemetryEvent {
  eventType:
    | 'xai_explanation_shown'
    | 'xai_details_opened'
    | 'recommendation_accepted'
    | 'recommendation_rejected'
    | 'recommendation_ignored';
  explanationId: string;
  taskId?: string;
  recommendationId?: string;
  metadata?: Record<string, any>;
}
