import { Task, TelemetryEvent, MLBehavioralFeatureVector } from '@saarathi/types';

export class MLFeatureExtractor {
  /**
   * Extract machine learning behavioral feature vectors from tasks and telemetry
   */
  public static extractFeatures(
    userId: string,
    tasks: Task[],
    events: TelemetryEvent[] = []
  ): MLBehavioralFeatureVector[] {
    const featureVectors: MLBehavioralFeatureVector[] = [];

    // Calculate historical user completion baseline
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const overallCompletionRate = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 70;

    for (const task of tasks) {
      const createdAt = new Date(task.createdAt || Date.now());
      const dayOfWeek = isNaN(createdAt.getTime()) ? 1 : createdAt.getDay();
      const hourOfDay = isNaN(createdAt.getTime()) ? 9 : createdAt.getHours();

      // Correlate notification events for this task
      const taskEvents = events.filter(
        (e) => (e.entityId === task.id || (e.metadata && (e.metadata as any).taskId === task.id))
      );
      const notificationCount = taskEvents.filter((e) => e.eventType === 'reminder_sent').length;
      const snoozeCount = taskEvents.filter((e) => e.eventType === 'reminder_snoozed').length;

      // Determine outcome target
      let outcomeTarget: MLBehavioralFeatureVector['outcomeTarget'] = 'completed_on_time';
      if (task.status === 'completed') {
        outcomeTarget = task.postponeCount > 0 ? 'completed_late' : 'completed_on_time';
      } else if (task.status === 'skipped') {
        outcomeTarget = 'skipped';
      } else if (task.postponeCount > 0) {
        outcomeTarget = 'postponed';
      } else {
        outcomeTarget = 'completed_on_time';
      }

      // Deadline distance in hours
      let deadlineDistanceHours: number | undefined;
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          deadlineDistanceHours = Math.max(
            0,
            (deadlineDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          );
        }
      }

      const vector: MLBehavioralFeatureVector = {
        userId,
        taskId: task.id,
        taskCategory: task.category || 'General',
        priority: task.priority || 'Medium',
        estimatedDuration: task.estimatedDuration || 30,
        actualDuration: task.estimatedDuration,
        dayOfWeek,
        hourOfDay,
        energyLevel: task.energyRequired || 'Medium',
        moodLevel: 'neutral',
        notificationCount,
        snoozeCount,
        rescheduleCount: task.postponeCount || 0,
        previousCompletionRate: Math.round(overallCompletionRate),
        timeToStartMinutes: 15,
        timeToCompletionMinutes: task.estimatedDuration,
        deadlineDistanceHours,
        focusMinutesPreceding: 25,
        outcomeTarget,
      };

      featureVectors.push(vector);
    }

    return featureVectors;
  }
}
