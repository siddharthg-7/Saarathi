import { describe, it, expect } from 'vitest';
import { resolveConflict, extractSyncMetadata } from '@saarathi/api';
import { Task } from '@saarathi/types';

describe('Offline Sync Service - Conflict Resolution Strategy', () => {
  const localTask: Task = {
    id: 'task_100',
    title: 'Offline Edit Title',
    category: 'Work',
    energyRequired: 'High',
    estimatedDuration: 30,
    difficulty: 3,
    urgency: 'High',
    status: 'pending',
    aiSummary: '',
    skipProbability: 10,
    delayProbability: 10,
    postponeCount: 0,
    tags: ['work', 'urgent'],
    context: 'Office',
    subtasks: [],
    createdAt: '2026-08-04T10:00:00Z',
    version: 2,
    syncStatus: 'pending',
  };

  const remoteTask: Task = {
    id: 'task_100',
    title: 'Original Title',
    category: 'Work',
    energyRequired: 'Medium',
    estimatedDuration: 45,
    difficulty: 2,
    urgency: 'Medium',
    status: 'in_progress',
    aiSummary: 'Updated on server',
    skipProbability: 15,
    delayProbability: 15,
    postponeCount: 0,
    tags: ['work'],
    context: 'Office',
    subtasks: [],
    createdAt: '2026-08-04T10:00:00Z',
    version: 3,
    syncStatus: 'synced',
  };

  it('should perform field-level merge correctly keeping local non-null modifications and incrementing version', () => {
    const merged = resolveConflict(localTask, remoteTask, 'field_merge');

    expect(merged.id).toBe('task_100');
    expect(merged.title).toBe('Offline Edit Title');
    expect(merged.energyRequired).toBe('High');
    expect(merged.aiSummary).toBe('Updated on server');
    expect(merged.version).toBe(4);
    expect(merged.syncStatus).toBe('pending');
  });

  it('should support server_wins strategy', () => {
    const merged = resolveConflict(localTask, remoteTask, 'server_wins');
    expect(merged.title).toBe('Original Title');
    expect(merged.syncStatus).toBe('synced');
  });

  it('should support client_wins strategy', () => {
    const merged = resolveConflict(localTask, remoteTask, 'client_wins');
    expect(merged.title).toBe('Offline Edit Title');
    expect(merged.version).toBe(4);
    expect(merged.syncStatus).toBe('pending');
  });

  it('should extract sync metadata correctly from snapshot metadata', () => {
    const mockMetadata = {
      hasPendingWrites: true,
      fromCache: true,
      isEqual: () => false,
    };
    const extracted = extractSyncMetadata(mockMetadata);
    expect(extracted.hasPendingWrites).toBe(true);
    expect(extracted.fromCache).toBe(true);
    expect(extracted.lastSyncedAt).toBeDefined();
  });
});
