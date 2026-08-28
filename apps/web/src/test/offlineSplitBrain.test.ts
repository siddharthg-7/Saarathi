import { describe, it, expect } from 'vitest';
import { resolveConflict } from '@saarathi/api';
import { Task } from '@saarathi/types';

describe('Offline Split-Brain & Conflict Resolution', () => {
  const createMockTask = (overrides: Partial<Task>): Task => ({
    id: 'task-split-1',
    title: 'Submit quarterly report',
    description: 'Drafting initial tables',
    estimatedDuration: 45,
    energyRequired: 'Medium',
    category: 'Work',
    difficulty: 3,
    urgency: 'Medium',
    status: 'pending',
    aiSummary: 'Quarterly review',
    skipProbability: 10,
    delayProbability: 15,
    postponeCount: 0,
    tags: ['work'],
    context: 'Office',
    subtasks: [],
    createdAt: '2026-08-28T09:00:00Z',
    version: 1,
    ...overrides,
  });

  it('should resolve split-brain conflict where Mobile modified status and Web edited remote fields (field_merge)', () => {
    // Base task on cloud at T0 (v1)
    const baseTask = createMockTask({
      id: 'task-split-1',
      title: 'Submit quarterly report',
      description: 'Drafting initial tables',
      status: 'pending',
      version: 1,
      updatedAt: '2026-08-28T10:00:00Z',
    });

    // Mobile client went offline, completed task (local v2)
    const localMobileTask: Task = {
      ...baseTask,
      status: 'completed',
      version: 2,
      updatedAt: '2026-08-28T10:05:00Z',
      syncStatus: 'pending',
    };

    // Web client was online, modified remote task description
    const remoteWebTask: Task = {
      ...baseTask,
      status: 'in_progress',
      version: 2,
      updatedAt: '2026-08-28T10:06:00Z',
      syncStatus: 'synced',
    };

    // Reconnection triggers field_merge resolution
    const resolved = resolveConflict(localMobileTask, remoteWebTask, 'field_merge');

    // Expected: status is preserved from local mobile mutations
    expect(resolved.id).toBe('task-split-1');
    expect(resolved.status).toBe('completed');
    expect(resolved.version).toBe(3); // Bumped version
  });

  it('should favor client state under client_wins strategy', () => {
    const localTask = createMockTask({
      id: 'task-split-2',
      title: 'Local Client Mutation',
      status: 'in_progress',
      version: 2,
      updatedAt: '2026-08-28T09:00:00Z',
    });

    const remoteTask = createMockTask({
      id: 'task-split-2',
      title: 'Remote Mutation',
      status: 'completed',
      version: 3,
      updatedAt: '2026-08-28T09:15:00Z',
    });

    const resolved = resolveConflict(localTask, remoteTask, 'client_wins');
    expect(resolved.title).toBe('Local Client Mutation');
    expect(resolved.status).toBe('in_progress');
    expect(resolved.version).toBe(4);
  });

  it('should enforce server_wins policy when explicitly configured', () => {
    const localTask = createMockTask({
      id: 'task-split-3',
      title: 'Local Client Overwrite',
      version: 2,
      updatedAt: '2026-08-28T12:00:00Z',
    });

    const remoteTask = createMockTask({
      id: 'task-split-3',
      title: 'Authoritative Server Document',
      version: 1,
      updatedAt: '2026-08-28T11:00:00Z',
    });

    const resolved = resolveConflict(localTask, remoteTask, 'server_wins');
    expect(resolved.title).toBe('Authoritative Server Document');
    expect(resolved.syncStatus).toBe('synced');
  });

  it('should preserve remote string content when local string is empty in field_merge', () => {
    const localTask = createMockTask({
      id: 'task-split-4',
      description: '', // Empty local
      version: 2,
    });

    const remoteTask = createMockTask({
      id: 'task-split-4',
      description: 'Crucial cloud description',
      version: 2,
    });

    const resolved = resolveConflict(localTask, remoteTask, 'field_merge');
    expect(resolved.description).toBe('Crucial cloud description');
  });

  it('should preserve non-empty local tags over empty remote array in field_merge', () => {
    const localTask = createMockTask({
      id: 'task-split-5',
      tags: ['urgent', 'engineering'],
      version: 2,
    });

    const remoteTask = createMockTask({
      id: 'task-split-5',
      tags: [],
      version: 2,
    });

    const resolved = resolveConflict(localTask, remoteTask, 'field_merge');
    expect(resolved.tags).toEqual(['urgent', 'engineering']);
  });
});
