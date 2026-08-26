import { OfflineAudioJob } from '@saarathi/types';
import { networkMonitor } from './networkMonitor';
import { apiClient } from '../client';

export type JobUpdateCallback = (job: OfflineAudioJob) => void;

class OfflineAudioQueue {
  private static STORAGE_KEY = 'saarathi_offline_audio_queue_v1';
  private jobs: Map<string, OfflineAudioJob> = new Map();
  private maxConcurrency: number = 2;
  private activeUploads: number = 0;
  private isProcessing: boolean = false;
  private listeners: Set<JobUpdateCallback> = new Set();

  constructor() {
    this.loadFromStorage();
    // Auto-process whenever network comes back online
    networkMonitor.subscribe((status) => {
      if (status === 'online') {
        this.processQueue();
      }
    });
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(OfflineAudioQueue.STORAGE_KEY);
      if (raw) {
        const parsed: OfflineAudioJob[] = JSON.parse(raw);
        for (const j of parsed) {
          // Reset stuck 'uploading' or 'processing' states on app restart
          if (j.status === 'uploading' || j.status === 'processing') {
            j.status = 'queued';
          }
          this.jobs.set(j.id, j);
        }
      }
    } catch (e) {
      console.warn('[OfflineAudioQueue] Failed to load queue from storage:', e);
    }
  }

  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = Array.from(this.jobs.values());
      localStorage.setItem(OfflineAudioQueue.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[OfflineAudioQueue] Failed to persist queue:', e);
    }
  }

  public enqueueJob(
    userId: string,
    localFilePath: string,
    checksum?: string
  ): OfflineAudioJob {
    // Deduplication check: if a job with identical checksum is already queued/completed
    if (checksum) {
      for (const existing of this.jobs.values()) {
        if (existing.userId === userId && existing.checksum === checksum) {
          if (existing.status === 'queued' || existing.status === 'uploading' || existing.status === 'completed') {
            return existing;
          }
        }
      }
    }

    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newJob: OfflineAudioJob = {
      id,
      userId,
      localFilePath,
      createdAt: new Date().toISOString(),
      status: 'queued',
      retryCount: 0,
      checksum: checksum || null,
    };

    this.jobs.set(id, newJob);
    this.persistToStorage();
    this.notifyUpdate(newJob);

    if (networkMonitor.isOnline()) {
      this.processQueue();
    }

    return newJob;
  }

  public getJobs(): OfflineAudioJob[] {
    return Array.from(this.jobs.values());
  }

  public getJob(id: string): OfflineAudioJob | undefined {
    return this.jobs.get(id);
  }

  public subscribe(listener: JobUpdateCallback): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyUpdate(job: OfflineAudioJob): void {
    for (const l of this.listeners) {
      try {
        l(job);
      } catch (e) {
        console.error('[OfflineAudioQueue] Listener error:', e);
      }
    }
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queuedJobs = Array.from(this.jobs.values()).filter(
        (j) => j.status === 'queued' || (j.status === 'retry_wait' && (!j.nextAttemptAt || new Date(j.nextAttemptAt) <= new Date()))
      );

      for (const job of queuedJobs) {
        if (!networkMonitor.isOnline()) break;
        if (this.activeUploads >= this.maxConcurrency) break;

        this.processSingleJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processSingleJob(job: OfflineAudioJob): Promise<void> {
    this.activeUploads++;
    job.status = 'uploading';
    job.lastAttemptAt = new Date().toISOString();
    this.persistToStorage();
    this.notifyUpdate(job);

    try {
      // Simulate/Trigger audio submission or text transcript processing
      const res = await apiClient.post<any>('/brain-dump/process', {
        transcript: job.localFilePath.startsWith('data:') || job.localFilePath.startsWith('http')
          ? 'Audio recorded while offline'
          : job.localFilePath,
        checkpointId: job.remoteId || undefined,
      });

      job.status = 'completed';
      job.remoteId = res?.brainDumpId || job.id;
      this.persistToStorage();
      this.notifyUpdate(job);
    } catch (err: any) {
      job.retryCount += 1;
      if (job.retryCount >= 3) {
        job.status = 'failed';
        job.errorMessage = err?.message || 'Processing failed after max retries';
      } else {
        job.status = 'retry_wait';
        const delayMs = 1000 * Math.pow(2, job.retryCount);
        job.nextAttemptAt = new Date(Date.now() + delayMs).toISOString();
      }
      this.persistToStorage();
      this.notifyUpdate(job);
    } finally {
      this.activeUploads = Math.max(0, this.activeUploads - 1);
      // Continue next in queue
      this.processQueue();
    }
  }

  public clearCompleted(): void {
    for (const [id, j] of this.jobs.entries()) {
      if (j.status === 'completed') {
        this.jobs.delete(id);
      }
    }
    this.persistToStorage();
  }

  public clearAll(): void {
    this.jobs.clear();
    this.persistToStorage();
  }
}

export const offlineAudioQueue = new OfflineAudioQueue();
