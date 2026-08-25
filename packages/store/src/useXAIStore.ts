import { create } from 'zustand';
import {
  XAIExplanation,
  ScheduleRecommendation,
  FeatureMetadata,
  XAITelemetryEvent,
} from '@saarathi/types';
import { xaiApi } from '@saarathi/api';

export interface XAIState {
  explanationsByTaskId: Record<string, XAIExplanation>;
  recommendationsByTaskId: Record<string, ScheduleRecommendation>;
  featureRegistry: FeatureMetadata[];
  activeModalExplanation: XAIExplanation | null;
  loading: boolean;

  // Actions
  fetchTaskExplanation: (taskId: string, userId?: string) => Promise<XAIExplanation>;
  fetchScheduleRecommendation: (
    taskId: string,
    targetDate?: string,
    preferredTime?: string
  ) => Promise<ScheduleRecommendation>;
  fetchFeatureRegistry: () => Promise<void>;
  openExplanationModal: (explanation: XAIExplanation) => void;
  closeExplanationModal: () => void;
  acceptRecommendation: (recommendation: ScheduleRecommendation) => Promise<void>;
  rejectRecommendation: (recommendation: ScheduleRecommendation) => Promise<void>;
  trackInteraction: (
    eventType: XAITelemetryEvent['eventType'],
    explanationId: string,
    taskId?: string,
    recommendationId?: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  invalidateCache: (taskId?: string) => void;
}

export const useXAIStore = create<XAIState>((set, get) => ({
  explanationsByTaskId: {},
  recommendationsByTaskId: {},
  featureRegistry: [],
  activeModalExplanation: null,
  loading: false,

  fetchTaskExplanation: async (taskId: string, userId?: string) => {
    const existing = get().explanationsByTaskId[taskId];
    if (existing) return existing;

    set({ loading: true });
    try {
      const explanation = await xaiApi.explainTask(taskId, userId);
      set((state) => ({
        explanationsByTaskId: {
          ...state.explanationsByTaskId,
          [taskId]: explanation,
        },
        loading: false,
      }));

      // Log telemetry event
      get().trackInteraction('xai_explanation_shown', explanation.explanationId, taskId);

      return explanation;
    } catch {
      set({ loading: false });
      const fallback: XAIExplanation = {
        explanationId: `xai_store_fallback_${Date.now()}`,
        taskId,
        summary: 'Baseline task attributes evaluated.',
        predictionType: 'task_risk',
        probability: 30.0,
        quality: 'insufficient_data',
        qualityReason: 'Default fallback explanation.',
        contributors: [],
        evidence: [],
        modelMetadata: {
          modelName: 'task_risk_rf',
          modelVersion: '1.0.0',
          featureVersion: '1.0.0',
          explanationMethod: 'StoreFallback',
        },
        isColdStart: true,
        isFallback: true,
      };
      return fallback;
    }
  },

  fetchScheduleRecommendation: async (
    taskId: string,
    targetDate?: string,
    preferredTime?: string
  ) => {
    const existing = get().recommendationsByTaskId[taskId];
    if (existing) return existing;

    set({ loading: true });
    try {
      const res = await xaiApi.getScheduleRecommendation(taskId, targetDate, preferredTime);
      const rec = res.recommendation;
      set((state) => ({
        recommendationsByTaskId: {
          ...state.recommendationsByTaskId,
          [taskId]: rec,
        },
        loading: false,
      }));
      return rec;
    } catch {
      set({ loading: false });
      throw new Error('Failed to retrieve schedule recommendation');
    }
  },

  fetchFeatureRegistry: async () => {
    if (get().featureRegistry.length > 0) return;
    try {
      const res = await xaiApi.getFeatureRegistry();
      set({ featureRegistry: res.features });
    } catch {
      // Handled by api fallback
    }
  },

  openExplanationModal: (explanation: XAIExplanation) => {
    set({ activeModalExplanation: explanation });
    get().trackInteraction(
      'xai_details_opened',
      explanation.explanationId,
      explanation.taskId
    );
  },

  closeExplanationModal: () => {
    set({ activeModalExplanation: null });
  },

  acceptRecommendation: async (recommendation: ScheduleRecommendation) => {
    await get().trackInteraction(
      'recommendation_accepted',
      `exp_${recommendation.taskId}`,
      recommendation.taskId,
      recommendation.recommendationId
    );
  },

  rejectRecommendation: async (recommendation: ScheduleRecommendation) => {
    await get().trackInteraction(
      'recommendation_rejected',
      `exp_${recommendation.taskId}`,
      recommendation.taskId,
      recommendation.recommendationId
    );
  },

  trackInteraction: async (
    eventType: XAITelemetryEvent['eventType'],
    explanationId: string,
    taskId?: string,
    recommendationId?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await xaiApi.trackXAIInteraction({
        eventType,
        explanationId,
        taskId,
        recommendationId,
        metadata,
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  invalidateCache: (taskId?: string) => {
    if (taskId) {
      set((state) => {
        const nextExplanations = { ...state.explanationsByTaskId };
        const nextRecs = { ...state.recommendationsByTaskId };
        delete nextExplanations[taskId];
        delete nextRecs[taskId];
        return {
          explanationsByTaskId: nextExplanations,
          recommendationsByTaskId: nextRecs,
        };
      });
    } else {
      set({ explanationsByTaskId: {}, recommendationsByTaskId: {} });
    }
  },
}));
