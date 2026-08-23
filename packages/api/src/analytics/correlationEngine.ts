import {
  Task,
  TelemetryEvent,
  EnergyCorrelationStats,
  ReschedulingStats,
  KairoAnalyticsStats,
} from '@saarathi/types';

export class CorrelationEngine {
  /**
   * Calculate descriptive correlations between energy levels and task completion rates
   */
  public static calculateEnergyCorrelations(
    tasks: Task[],
    events: TelemetryEvent[] = []
  ): EnergyCorrelationStats[] {
    const energyBuckets: Record<'low' | 'medium' | 'high', { total: number; completed: number; focusMins: number }> = {
      low: { total: 0, completed: 0, focusMins: 0 },
      medium: { total: 0, completed: 0, focusMins: 0 },
      high: { total: 0, completed: 0, focusMins: 0 },
    };

    // 1. Bucket tasks by energyRequired
    for (const task of tasks) {
      const level = (task.energyRequired || 'Medium').toLowerCase() as 'low' | 'medium' | 'high';
      if (energyBuckets[level]) {
        energyBuckets[level].total++;
        if (task.status === 'completed') {
          energyBuckets[level].completed++;
        }
        energyBuckets[level].focusMins += task.estimatedDuration || 30;
      }
    }

    const levels: ('low' | 'medium' | 'high')[] = ['high', 'medium', 'low'];
    return levels.map((lvl) => {
      const b = energyBuckets[lvl];
      const rate = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
      const avgFocus = b.total > 0 ? Math.round(b.focusMins / b.total) : 0;

      let description = `Tasks with ${lvl} energy requirement had a ${rate}% completion rate across ${b.total} recorded tasks.`;
      if (b.total === 0) {
        description = `No tasks recorded with ${lvl} energy level yet.`;
      }

      return {
        energyLevel: lvl,
        tasksCount: b.total,
        completionRate: rate,
        avgFocusMinutes: avgFocus,
        description,
      };
    });
  }

  /**
   * Calculate rescheduling patterns and identify high-reschedule task categories and times
   */
  public static calculateReschedulingStats(
    tasks: Task[],
    events: TelemetryEvent[] = []
  ): ReschedulingStats {
    let totalReschedules = 0;
    const categoryCount: Record<string, number> = {};
    const weekdayCount: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };
    const hourCount: Record<number, number> = {};

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // 1. Gather from task postpone counts
    for (const task of tasks) {
      const count = task.postponeCount || 0;
      if (count > 0) {
        totalReschedules += count;
        const cat = task.category || 'General';
        categoryCount[cat] = (categoryCount[cat] || 0) + count;
      }
    }

    // 2. Gather from telemetry events for exact timing
    for (const event of events) {
      if (
        event.eventType === 'task_postponed' ||
        event.eventType === 'task_rescheduled' ||
        event.eventType === 'task_snoozed'
      ) {
        const d = new Date(event.timestamp);
        if (!isNaN(d.getTime())) {
          const dayName = days[d.getUTCDay()];
          if (dayName) weekdayCount[dayName] = (weekdayCount[dayName] || 0) + 1;
          const hr = d.getUTCHours();
          hourCount[hr] = (hourCount[hr] || 0) + 1;
        }
      }
    }

    // Top rescheduled category
    let topCat: string | undefined;
    let topCatCount = 0;
    const categoryBreakdown = Object.entries(categoryCount).map(([category, count]) => {
      if (count > topCatCount) {
        topCatCount = count;
        topCat = category;
      }
      return { category, count };
    });

    // Top rescheduled weekday
    let topWeekday: string | undefined;
    let topWeekdayCount = 0;
    for (const [wday, c] of Object.entries(weekdayCount)) {
      if (c > topWeekdayCount) {
        topWeekdayCount = c;
        topWeekday = wday;
      }
    }

    // Top rescheduled hour
    let topHour: number | undefined;
    let topHourCount = 0;
    for (const [hrStr, c] of Object.entries(hourCount)) {
      const hr = parseInt(hrStr, 10);
      if (c > topHourCount) {
        topHourCount = c;
        topHour = hr;
      }
    }

    const plannedCount = Math.max(1, tasks.length);
    const rescheduleRate = Math.min(100, Math.round((totalReschedules / plannedCount) * 100));
    const avgPerTask = parseFloat((totalReschedules / plannedCount).toFixed(2));

    return {
      totalRescheduled: totalReschedules,
      rescheduleRate,
      averageReschedulesPerTask: avgPerTask,
      mostRescheduledCategory: topCat,
      mostRescheduledWeekday: topWeekday,
      mostRescheduledHour: topHour,
      categoryBreakdown,
    };
  }

  /**
   * Calculate AI / Kairo interaction metrics
   */
  public static calculateKairoStats(events: TelemetryEvent[] = []): KairoAnalyticsStats {
    let totalSessions = 0;
    let totalMessages = 0;
    let totalLatencyMs = 0;
    let latencyCount = 0;
    let tasksCreated = 0;
    let tasksModified = 0;
    let brainDumps = 0;
    let recommendationsShown = 0;
    let recommendationsAccepted = 0;
    let recommendationsRejected = 0;

    const sessionIds = new Set<string>();

    for (const evt of events) {
      if (evt.entityType === 'kairo') {
        if (evt.sessionId) sessionIds.add(evt.sessionId);

        if (evt.eventType === 'kairo_message_sent' || evt.eventType === 'kairo_response_received') {
          totalMessages++;
        }
        if (evt.eventType === 'kairo_response_received' && evt.metadata?.responseLatencyMs) {
          totalLatencyMs += Number(evt.metadata.responseLatencyMs);
          latencyCount++;
        }
        if (evt.eventType === 'kairo_task_created') tasksCreated++;
        if (evt.eventType === 'kairo_task_modified') tasksModified++;
        if (evt.eventType === 'kairo_brain_dump_completed') brainDumps++;
        if (evt.eventType === 'kairo_recommendation_shown') recommendationsShown++;
        if (evt.eventType === 'kairo_recommendation_accepted') recommendationsAccepted++;
        if (evt.eventType === 'kairo_recommendation_rejected') recommendationsRejected++;
      }
    }

    totalSessions = Math.max(sessionIds.size, totalMessages > 0 ? 1 : 0);
    const avgMessagesPerSession = totalSessions > 0 ? parseFloat((totalMessages / totalSessions).toFixed(1)) : 0;
    const avgResponseLatencyMs = latencyCount > 0 ? Math.round(totalLatencyMs / latencyCount) : 480;

    const totalDecided = recommendationsAccepted + recommendationsRejected;
    const recRate =
      recommendationsShown > 0
        ? Math.round((recommendationsAccepted / recommendationsShown) * 100)
        : totalDecided > 0
        ? Math.round((recommendationsAccepted / totalDecided) * 100)
        : 75; // Baseline default if not enough observations

    return {
      totalSessions,
      totalMessages,
      avgMessagesPerSession,
      avgResponseLatencyMs,
      tasksCreatedViaKairo: tasksCreated,
      tasksModifiedViaKairo: tasksModified,
      brainDumpsProcessed: brainDumps,
      recommendationsShown,
      recommendationsAccepted,
      recommendationsRejected,
      recommendationAcceptanceRate: recRate,
    };
  }
}
