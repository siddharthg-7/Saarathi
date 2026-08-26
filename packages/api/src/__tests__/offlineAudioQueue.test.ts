import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineAudioQueue } from '../resilience/offlineAudioQueue';

describe('offlineAudioQueue', () => {
  beforeEach(() => {
    offlineAudioQueue.clearAll();
  });

  it('enqueues a new audio job in queued state', () => {
    const job = offlineAudioQueue.enqueueJob('user_123', 'file://path/audio.wav', 'checksum_abc');
    expect(job.id).toBeDefined();
    expect(job.userId).toBe('user_123');
    expect(job.status).toBe('queued');
    expect(job.checksum).toBe('checksum_abc');

    const retrieved = offlineAudioQueue.getJob(job.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(job.id);
  });

  it('prevents duplicate jobs with identical checksum', () => {
    const job1 = offlineAudioQueue.enqueueJob('user_123', 'file://path/audio.wav', 'checksum_duplicate');
    const job2 = offlineAudioQueue.enqueueJob('user_123', 'file://path/audio.wav', 'checksum_duplicate');

    // Should return existing job rather than creating a duplicate
    expect(job1.id).toBe(job2.id);
    expect(offlineAudioQueue.getJobs().length).toBe(1);
  });
});
