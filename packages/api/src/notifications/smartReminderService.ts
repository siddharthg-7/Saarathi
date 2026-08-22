import {
  Task,
  Reminder,
  NotificationPreferences,
  SmartReminderRecommendation,
  NotificationItem,
  EnergyLevel,
} from '@saarathi/types';
import { isWithinQuietHours, getNextQuietHoursEnd, getEffectiveTimezone } from './timezoneUtils';

export interface SmartRuleEvaluationContext {
  tasks: Task[];
  reminders: Reminder[];
  preferences: NotificationPreferences;
  userEnergy?: EnergyLevel; // 'Low' | 'Medium' | 'High'
  timezone?: string;
  currentTime?: Date;
}

export interface SmartRuleResult {
  notificationsToDispatch: NotificationItem[];
  recommendations: SmartReminderRecommendation[];
  suppressedReminderIds: string[];
}

export class SmartReminderService {
  /**
   * Evaluates deterministic smart reminder rules against current tasks and reminders.
   */
  public static evaluateRules(context: SmartRuleEvaluationContext): SmartRuleResult {
    const {
      tasks,
      reminders,
      preferences,
      userEnergy = 'Medium',
      timezone,
      currentTime = new Date(),
    } = context;

    const result: SmartRuleResult = {
      notificationsToDispatch: [],
      recommendations: [],
      suppressedReminderIds: [],
    };

    // If master notifications or smart reminders are disabled, return empty
    if (!preferences.globalNotificationEnabled || !preferences.smartReminderEnabled) {
      return result;
    }

    const inQuietHours = isWithinQuietHours(currentTime, preferences.quietHours, timezone);

    // ================= RULE 1 & 7: MISSED REMINDER ESCALATION & DUE SOON NUDGES =================
    tasks.forEach((task) => {
      if (task.status === 'completed') return;

      const associatedReminders = reminders.filter((r) => r.taskId === task.id);
      const isPostponedRepeatedly = (task.postponeCount || 0) >= 3;
      const totalSnoozeCount = associatedReminders.reduce((acc, r) => acc + (r.snoozeCount || 0), 0);

      // ================= RULE 2 & SECTION 17: REPEATED SNOOZE / POSTPONE RESCHEDULE RECOMMENDATION =================
      if (totalSnoozeCount >= 3 || isPostponedRepeatedly) {
        const count = Math.max(totalSnoozeCount, task.postponeCount);
        const reason = `You have postponed '${task.title}' ${count} times. Moving it to a dedicated morning block usually improves completion rate.`;
        
        result.recommendations.push({
          id: `rec_snooze_${task.id}_${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          currentScheduledTime: task.scheduledTime || task.deadline,
          recommendedTime: 'Tomorrow 09:00 AM',
          reason,
          confidence: 0.88,
          triggerRule: 'RULE_REPEATED_SNOOZE',
        });
      }

      // ================= RULE 4 & SECTION 14: ENERGY-AWARE REMINDER =================
      if (userEnergy === 'Low' && task.energyRequired === 'High') {
        const reason = `Your energy is currently Low, but '${task.title}' requires High concentration. Kairo recommends swapping for a lighter task or moving this to tomorrow morning.`;
        
        result.recommendations.push({
          id: `rec_energy_${task.id}_${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          currentScheduledTime: task.scheduledTime || task.deadline,
          recommendedTime: 'Tomorrow 08:30 AM',
          reason,
          confidence: 0.92,
          triggerRule: 'RULE_ENERGY_MISMATCH',
        });
      }

      // ================= RULE 7: PROGRESSIVE ESCALATION FOR UNSTARTED TASKS =================
      if (task.status === 'pending' && task.deadline) {
        const deadlineTime = Date.parse(task.deadline);
        if (!isNaN(deadlineTime)) {
          const diffMinutes = (deadlineTime - currentTime.getTime()) / (1000 * 60);

          // Grace period check: Task due within 20 mins and not yet started
          if (diffMinutes > 0 && diffMinutes <= 20) {
            const reason = `Task '${task.title}' is due in ${Math.round(diffMinutes)} minutes and hasn't been started yet.`;
            
            // Only generate notification if not during quiet hours (unless Critical priority)
            if (!inQuietHours || task.priority === 'Critical') {
              result.notificationsToDispatch.push({
                id: `smart_nudge_${task.id}_${Date.now()}`,
                title: `Kairo Smart Nudge: ${task.title}`,
                message: `You haven't started '${task.title}' yet. Want to do a focused 15-minute quick version?`,
                time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: currentTime.getTime(),
                type: 'smart_nudge',
                read: false,
                taskId: task.id,
                priority: task.priority || 'Medium',
                reason,
                actions: [
                  { actionId: 'done', label: 'Done' },
                  { actionId: 'snooze_30', label: 'Snooze 30m' },
                  { actionId: 'reschedule', label: 'Reschedule' },
                ],
              });
            }
          }
        }
      }
    });

    // ================= RULE 3: QUIET HOURS SUPPRESSION =================
    if (inQuietHours) {
      reminders.forEach((r) => {
        // Suppress non-critical reminders during quiet hours
        if (r.priority !== 'Critical' && r.status === 'scheduled') {
          result.suppressedReminderIds.push(r.id);
        }
      });
    }

    return result;
  }

  /**
   * Determines if a reminder should trigger right now, taking quiet hours and priority into account.
   */
  public static shouldTriggerReminder(
    reminder: Reminder,
    preferences: NotificationPreferences,
    timezone?: string,
    currentTime: Date = new Date()
  ): { canTrigger: boolean; reason: string; adjustedTriggerTime?: Date } {
    if (!preferences.globalNotificationEnabled) {
      return { canTrigger: false, reason: 'Notifications globally disabled' };
    }

    if (reminder.type === 'task' && !preferences.taskReminderEnabled) {
      return { canTrigger: false, reason: 'Task reminders disabled in preferences' };
    }

    if (reminder.type === 'smart' && !preferences.smartReminderEnabled) {
      return { canTrigger: false, reason: 'Smart reminders disabled in preferences' };
    }

    if (reminder.type === 'habit' && !preferences.habitReminderEnabled) {
      return { canTrigger: false, reason: 'Habit reminders disabled in preferences' };
    }

    if (reminder.type === 'focus' && !preferences.focusReminderEnabled) {
      return { canTrigger: false, reason: 'Focus reminders disabled in preferences' };
    }

    if (reminder.type === 'daily_brief' && !preferences.dailyBriefEnabled) {
      return { canTrigger: false, reason: 'Daily brief disabled in preferences' };
    }

    // Check quiet hours
    if (isWithinQuietHours(currentTime, preferences.quietHours, timezone)) {
      if (reminder.priority === 'Critical') {
        return {
          canTrigger: true,
          reason: 'Critical reminder bypasses quiet hours',
        };
      }
      const adjustedTime = getNextQuietHoursEnd(currentTime, preferences.quietHours, timezone);
      return {
        canTrigger: false,
        reason: 'Delayed due to quiet hours window',
        adjustedTriggerTime: adjustedTime,
      };
    }

    return { canTrigger: true, reason: 'All checks passed' };
  }
}
