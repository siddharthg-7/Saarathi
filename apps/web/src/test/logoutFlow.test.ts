import { describe, it, expect } from 'vitest';
import {
  useAuthStore,
  useTaskStore,
  useHabitGoalStore,
  useKairoStore,
  useNotificationStore,
  useAnalyticsStore,
  useMLStore,
  useMemoryStore,
  useXAIStore,
} from '@saarathi/store';

describe('Logout and State Purge Flow', () => {
  it('should reset all Zustand stores and purge user data upon logout', () => {
    // 1. Populate stores with user-specific sensitive data
    useAuthStore.getState().login({
      id: 'usr_secret_123',
      name: 'Private User',
      email: 'private@example.com',
    });

    useTaskStore.setState({
      tasks: [
        {
          id: 'task_confidential_1',
          uid: 'usr_secret_123',
          title: 'Secret Board Meeting Notes',
          estimatedDuration: 60,
          energyRequired: 'High',
          category: 'Strategy',
          priority: 'Critical',
          difficulty: 3,
          urgency: 'High',
          status: 'pending',
          aiSummary: 'Confidential strategy discussion.',
          skipProbability: 10,
          delayProbability: 5,
          postponeCount: 0,
          scheduledTime: '10:00 AM',
          tags: ['Private'],
          context: 'Office',
          subtasks: [],
          orderIndex: 0,
          createdAt: new Date().toISOString(),
          version: 1,
        },
      ],
      activeUid: 'usr_secret_123',
    });

    useHabitGoalStore.setState({
      habits: [
        {
          id: 'hab_private_1',
          title: 'Meditation',
          category: 'Health',
          streakCount: 5,
          completionPercentage: 80,
          bestDay: 'Monday',
          activeDays: [true, true, true, false, false, false, false],
          targetDaysPerWeek: 7,
          color: '#10B981',
          version: 1,
        },
      ],
      goals: [
        {
          id: 'goal_private_1',
          uid: 'usr_secret_123',
          title: 'Q3 Financial Target',
          description: 'Achieve Q3 targets',
          category: 'Finance',
          status: 'in_progress',
          targetDate: '2026-09-30',
          dailyTasksCount: 2,
          milestones: [],
          version: 1,
        },
      ],
      activeUid: 'usr_secret_123',
    });

    useKairoStore.setState({
      chatHistory: [
        {
          id: 'msg_1',
          role: 'user',
          message: 'What is my secret account password?',
          timestamp: '11:00 AM',
        },
      ],
      isThinking: true,
    });

    useNotificationStore.setState({
      notifications: [
        {
          id: 'notif_1',
          title: 'Confidential Alert',
          message: 'Your meeting is now.',
          type: 'task_reminder',
          time: '11:00 AM',
          read: false,
        },
      ],
      unreadCount: 1,
      activeUid: 'usr_secret_123',
    });

    useMLStore.setState({
      taskRiskMap: {
        task_confidential_1: {
          taskId: 'task_confidential_1',
          skipProbability: 90,
          delayProbability: 80,
          completionProbability: 10,
          highRisk: true,
          riskLevel: 'critical',
          contributingFactors: ['Fatigue'],
          recommendedAction: 'Reschedule',
          isColdStart: false,
        },
      },
      isColdStart: false,
    });

    useMemoryStore.setState({
      memories: [
        {
          id: 'mem_1',
          userId: 'usr_secret_123',
          content: 'User prefers evening coding sessions.',
          sourceType: 'user_preference',
          sourceId: 'pref_1',
          importance: 0.9,
          confidence: 0.95,
          embeddingModel: 'text-embedding-004',
          embeddingVersion: '1.0.0',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    // Verify populated state
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useTaskStore.getState().tasks.length).toBe(1);
    expect(useHabitGoalStore.getState().habits.length).toBe(1);
    expect(useHabitGoalStore.getState().goals.length).toBe(1);
    expect(useKairoStore.getState().chatHistory.length).toBe(1);
    expect(useNotificationStore.getState().notifications.length).toBe(1);
    expect(Object.keys(useMLStore.getState().taskRiskMap).length).toBe(1);
    expect(useMemoryStore.getState().memories.length).toBe(1);

    // 2. Perform Logout & State Purge
    useAuthStore.getState().logout();
    useTaskStore.getState().reset();
    useHabitGoalStore.getState().reset();
    useKairoStore.getState().clearHistory();
    useNotificationStore.getState().reset();
    useAnalyticsStore.getState().reset();
    useMLStore.getState().reset();
    useMemoryStore.getState().reset();
    useXAIStore.getState().invalidateCache();

    // 3. Verify that NO confidential or user details remain
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().userProfile.id).toBe('');
    expect(useAuthStore.getState().userProfile.email).toBe('');
    expect(useTaskStore.getState().tasks).toEqual([]);
    expect(useTaskStore.getState().projects).toEqual([]);
    expect(useTaskStore.getState().activeUid).toBeNull();
    expect(useHabitGoalStore.getState().habits).toEqual([]);
    expect(useHabitGoalStore.getState().goals).toEqual([]);
    expect(useHabitGoalStore.getState().activeUid).toBeNull();
    expect(useKairoStore.getState().chatHistory).toEqual([]);
    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().reminders).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().activeUid).toBeNull();
    expect(useMLStore.getState().taskRiskMap).toEqual({});
    expect(useMLStore.getState().burnoutReport).toBeNull();
    expect(useMemoryStore.getState().memories).toEqual([]);
    expect(useXAIStore.getState().explanationsByTaskId).toEqual({});
  });
});
