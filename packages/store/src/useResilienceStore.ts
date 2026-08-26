import { create } from 'zustand';
import {
  ProviderHealth,
  SystemDegradationLevel,
  OfflineAudioJob,
} from '@saarathi/types';
import {
  networkMonitor,
  NetworkStatus,
  offlineAudioQueue,
  apiClient,
} from '@saarathi/api';

export interface ResilienceState {
  networkStatus: NetworkStatus;
  degradationLevel: SystemDegradationLevel;
  degradationReason: string | null;
  providerHealth: Record<string, ProviderHealth>;
  offlineJobs: OfflineAudioJob[];
  isSyncingQueue: boolean;

  // Actions
  setNetworkStatus: (status: NetworkStatus) => void;
  fetchProviderHealth: () => Promise<void>;
  enqueueOfflineAudio: (userId: string, localFilePath: string, checksum?: string) => OfflineAudioJob;
  processOfflineQueue: () => Promise<void>;
  clearCompletedJobs: () => void;
}

export const useResilienceStore = create<ResilienceState>((set, get) => {
  // Listen to network transitions
  networkMonitor.subscribe((status) => {
    set({ networkStatus: status });
    if (status === 'offline') {
      set({
        degradationLevel: 4,
        degradationReason: 'Network connection offline; operating with local storage',
      });
    } else if (get().degradationLevel === 4) {
      set({
        degradationLevel: 0,
        degradationReason: null,
      });
    }
  });

  // Listen to offline queue updates
  offlineAudioQueue.subscribe(() => {
    set({ offlineJobs: offlineAudioQueue.getJobs() });
  });

  return {
    networkStatus: networkMonitor.getStatus(),
    degradationLevel: networkMonitor.isOnline() ? 0 : 4,
    degradationReason: networkMonitor.isOnline() ? null : 'Network offline',
    providerHealth: {},
    offlineJobs: offlineAudioQueue.getJobs(),
    isSyncingQueue: false,

    setNetworkStatus: (status: NetworkStatus) => {
      networkMonitor.setStatus(status);
      set({ networkStatus: status });
    },

    fetchProviderHealth: async () => {
      try {
        const res = await apiClient.get<{
          degradationLevel: SystemDegradationLevel;
          degradationReason: string | null;
          providers: Record<string, ProviderHealth>;
        }>('/resilience/health');

        if (res) {
          set({
            degradationLevel: res.degradationLevel,
            degradationReason: res.degradationReason,
            providerHealth: res.providers || {},
          });
        }
      } catch (err) {
        console.warn('[useResilienceStore] Could not fetch resilience health:', err);
      }
    },

    enqueueOfflineAudio: (userId: string, localFilePath: string, checksum?: string) => {
      const job = offlineAudioQueue.enqueueJob(userId, localFilePath, checksum);
      set({ offlineJobs: offlineAudioQueue.getJobs() });
      return job;
    },

    processOfflineQueue: async () => {
      set({ isSyncingQueue: true });
      try {
        await offlineAudioQueue.processQueue();
      } finally {
        set({
          isSyncingQueue: false,
          offlineJobs: offlineAudioQueue.getJobs(),
        });
      }
    },

    clearCompletedJobs: () => {
      offlineAudioQueue.clearCompleted();
      set({ offlineJobs: offlineAudioQueue.getJobs() });
    },
  };
});
