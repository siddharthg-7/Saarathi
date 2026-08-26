import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useResilienceStore } from '../useResilienceStore';
import { apiClient } from '@saarathi/api';

vi.mock('@saarathi/api', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe('useResilienceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default status and degradation level', () => {
    const state = useResilienceStore.getState();
    expect(state.networkStatus).toBeDefined();
    expect(state.degradationLevel).toBeDefined();
  });

  it('updates state upon setting network status', () => {
    const store = useResilienceStore.getState();
    store.setNetworkStatus('offline');

    const updated = useResilienceStore.getState();
    expect(updated.networkStatus).toBe('offline');
    expect(updated.degradationLevel).toBe(4);
    expect(updated.degradationReason).toContain('offline');
  });

  it('fetches provider health from resilience endpoint', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      degradationLevel: 1,
      degradationReason: 'Groq degraded',
      providers: {
        groq: { provider: 'groq', status: 'degraded', circuitState: 'OPEN' },
        gemini: { provider: 'gemini', status: 'healthy', circuitState: 'CLOSED' },
      },
    });

    await useResilienceStore.getState().fetchProviderHealth();

    const state = useResilienceStore.getState();
    expect(state.degradationLevel).toBe(1);
    expect(state.providerHealth.groq).toBeDefined();
    expect(state.providerHealth.groq.circuitState).toBe('OPEN');
  });

  it('enqueues an offline audio job', () => {
    const job = useResilienceStore.getState().enqueueOfflineAudio('user_1', 'file://path/voice.wav', 'checksum_test');
    expect(job).toBeDefined();
    expect(job.userId).toBe('user_1');

    const jobs = useResilienceStore.getState().offlineJobs;
    expect(jobs.some((j) => j.id === job.id)).toBe(true);
  });
});
