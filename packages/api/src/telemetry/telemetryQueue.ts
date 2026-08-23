import { TelemetryEvent, TelemetrySyncStatus } from '@saarathi/types';
import { apiClient } from '../client';

export interface QueuedTelemetryEvent {
  event: TelemetryEvent;
  status: TelemetrySyncStatus;
  enqueuedAt: string;
  retryCount: number;
  lastAttemptAt?: string;
  error?: string;
}

const STORAGE_KEY = 'saarathi_telemetry_queue';
const MAX_BATCH_SIZE = 50;
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;

export class TelemetryQueue {
  private static instance: TelemetryQueue;
  private queue: QueuedTelemetryEvent[] = [];
  private seenEventIds: Set<string> = new Set();
  private isProcessing = false;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush());
    }
  }

  public static getInstance(): TelemetryQueue {
    if (!TelemetryQueue.instance) {
      TelemetryQueue.instance = new TelemetryQueue();
    }
    return TelemetryQueue.instance;
  }

  /**
   * Enqueue a new telemetry event with deduplication
   */
  public enqueue(event: TelemetryEvent): void {
    if (this.seenEventIds.has(event.id)) {
      return;
    }

    this.seenEventIds.add(event.id);

    const queuedItem: QueuedTelemetryEvent = {
      event: { ...event, syncStatus: 'pending' },
      status: 'pending',
      enqueuedAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.queue.push(queuedItem);
    this.saveQueue();

    // Schedule background flush
    this.scheduleFlush(100);
  }

  /**
   * Return all queued items
   */
  public getItems(): QueuedTelemetryEvent[] {
    return [...this.queue];
  }

  /**
   * Return counts by status
   */
  public getStatusSummary(): {
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    total: number;
  } {
    const summary = { pending: 0, syncing: 0, synced: 0, failed: 0, total: this.queue.length };
    for (const item of this.queue) {
      if (item.status === 'pending') summary.pending++;
      else if (item.status === 'syncing') summary.syncing++;
      else if (item.status === 'synced') summary.synced++;
      else if (item.status === 'failed') summary.failed++;
    }
    return summary;
  }

  /**
   * Flush pending events to backend in batches
   */
  public async flush(): Promise<void> {
    if (this.isProcessing) return;

    const pendingItems = this.queue.filter(
      (item) => item.status === 'pending' || (item.status === 'failed' && item.retryCount < MAX_RETRIES)
    );

    if (pendingItems.length === 0) return;

    this.isProcessing = true;

    try {
      const batch = pendingItems.slice(0, MAX_BATCH_SIZE);
      const batchIds = new Set(batch.map((b) => b.event.id));

      // Mark batch as syncing
      this.queue = this.queue.map((item) =>
        batchIds.has(item.event.id) ? { ...item, status: 'syncing' as const } : item
      );
      this.saveQueue();

      try {
        const eventsPayload = batch.map((b) => b.event);
        await apiClient.post<{ status: string; processed: number }>('/telemetry/batch', {
          events: eventsPayload,
        });

        // Mark successfully synced
        this.queue = this.queue.map((item) =>
          batchIds.has(item.event.id)
            ? {
                ...item,
                status: 'synced' as const,
                lastAttemptAt: new Date().toISOString(),
              }
            : item
        );

        // Keep queue trimmed: retain at most 100 recent synced events
        this.pruneSynced();
      } catch (err: any) {
        const errorMsg = err?.message || 'Network error';
        // Mark failed and increment retry with exponential backoff
        this.queue = this.queue.map((item) => {
          if (batchIds.has(item.event.id)) {
            const nextRetries = item.retryCount + 1;
            return {
              ...item,
              status: nextRetries >= MAX_RETRIES ? ('failed' as const) : ('pending' as const),
              retryCount: nextRetries,
              lastAttemptAt: new Date().toISOString(),
              error: errorMsg,
            };
          }
          return item;
        });

        // Schedule next retry with exponential backoff
        const minRetry = Math.min(...batch.map((b) => b.retryCount + 1));
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, Math.min(minRetry, 5));
        this.scheduleFlush(backoff);
      }

      this.saveQueue();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear all items from the queue
   */
  public clear(): void {
    this.queue = [];
    this.seenEventIds.clear();
    this.saveQueue();
  }

  private scheduleFlush(delayMs: number): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    this.syncTimer = setTimeout(() => {
      this.flush().catch(() => {});
    }, delayMs);
  }

  private pruneSynced(): void {
    const synced = this.queue.filter((i) => i.status === 'synced');
    if (synced.length > 100) {
      const pendingAndFailed = this.queue.filter((i) => i.status !== 'synced');
      const recentSynced = synced.slice(-100);
      this.queue = [...pendingAndFailed, ...recentSynced];
    }
  }

  private loadQueue(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as QueuedTelemetryEvent[];
          if (Array.isArray(parsed)) {
            this.queue = parsed;
            this.seenEventIds = new Set(parsed.map((item) => item.event.id));
          }
        }
      }
    } catch {
      // In-memory fallback
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch {
      // Fallback
    }
  }
}

export const telemetryQueue = TelemetryQueue.getInstance();
