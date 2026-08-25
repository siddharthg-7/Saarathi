import { describe, it, expect, vi } from 'vitest';
import { xaiApi, apiClient } from '@saarathi/api';

describe('xaiApi Client', () => {
  it('explainTask calls /xai/explain-task and returns response', async () => {
    const mockResponse = {
      explanationId: 'exp_api_1',
      taskId: 'task_api_1',
      summary: 'Explanation summary',
      predictionType: 'task_risk',
      probability: 70.0,
      quality: 'moderate_evidence',
      contributors: [],
      evidence: [],
      modelMetadata: {
        modelName: 'task_risk_rf',
        modelVersion: '1.0.0',
        featureVersion: '1.0.0',
        explanationMethod: 'TreeLocalAttribution',
      },
      isColdStart: false,
      isFallback: false,
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const res = await xaiApi.explainTask('task_api_1');
    expect(res.explanationId).toBe('exp_api_1');
    expect(res.taskId).toBe('task_api_1');
  });

  it('getFeatureRegistry calls /xai/feature-registry and returns metadata', async () => {
    const mockRegistry = {
      features: [
        {
          feature: 'time_of_day',
          displayName: 'Scheduled Time Window',
          category: 'temporal',
          description: 'Hour of task',
          privacyLevel: 'private',
        },
      ],
      count: 1,
      version: '1.0.0',
    };

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockRegistry);

    const res = await xaiApi.getFeatureRegistry();
    expect(res.version).toBe('1.0.0');
    expect(res.features.length).toBe(1);
    expect(res.features[0].displayName).toBe('Scheduled Time Window');
  });
});
