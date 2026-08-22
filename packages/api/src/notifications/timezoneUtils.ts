import { QuietHoursConfig } from '@saarathi/types';

/**
 * Returns the effective IANA timezone string.
 */
export function getEffectiveTimezone(userTimezone?: string): string {
  if (userTimezone && isValidTimezone(userTimezone)) {
    return userTimezone;
  }
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
  } catch {}
  return 'UTC';
}

/**
 * Validates if an IANA timezone string is valid in the current JS environment.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a Date object representing an exact calendar date & time in a specified IANA timezone.
 */
export function createDateInTimezone(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timezone: string = 'UTC'
): Date {
  const effectiveTz = getEffectiveTimezone(timezone);
  if (effectiveTz === 'UTC') {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }

  // Use UTC trial date and compute timeZone offset difference
  const trialUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: effectiveTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(trialUtc);
  const pMap: Record<string, number> = {};
  parts.forEach((p) => {
    if (p.type !== 'literal') pMap[p.type] = parseInt(p.value, 10);
  });

  const tzHours = pMap.hour === 24 ? 0 : (pMap.hour || 0);
  const tzAsUtc = Date.UTC(pMap.year, pMap.month - 1, pMap.day, tzHours, pMap.minute || 0, pMap.second || 0);
  const offset = tzAsUtc - trialUtc.getTime();

  return new Date(trialUtc.getTime() - offset);
}

/**
 * Checks if a given timestamp/Date is currently inside the user's quiet hours.
 * Handles both intra-day spans (e.g. 13:00 to 15:00) and overnight spans (e.g. 23:00 to 07:00).
 */
export function isWithinQuietHours(
  date: Date = new Date(),
  quietHours: QuietHoursConfig,
  timezone?: string
): boolean {
  if (!quietHours || !quietHours.enabled || !quietHours.start || !quietHours.end) {
    return false;
  }

  const effectiveTz = getEffectiveTimezone(timezone);
  
  // Format current date into hour & minute in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: effectiveTz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutePart = parts.find((p) => p.type === 'minute')?.value || '00';

  const currentMinutes = parseInt(hourPart, 10) * 60 + parseInt(minutePart, 10);

  const [startH, startM] = quietHours.start.split(':').map((v) => parseInt(v, 10) || 0);
  const [endH, endM] = quietHours.end.split(':').map((v) => parseInt(v, 10) || 0);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Standard daytime window, e.g. 14:00 to 16:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window, e.g. 23:00 (1380m) to 07:00 (420m)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Computes the Date when the next quiet hours end, in the target timezone.
 */
export function getNextQuietHoursEnd(
  fromDate: Date = new Date(),
  quietHours: QuietHoursConfig,
  timezone?: string
): Date {
  if (!quietHours || !quietHours.end) {
    return new Date(fromDate.getTime() + 60 * 60 * 1000); // fallback: 1 hour later
  }

  const effectiveTz = getEffectiveTimezone(timezone);
  const [endH, endM] = quietHours.end.split(':').map((v) => parseInt(v, 10) || 0);

  // Get current year, month, day in target timezone
  const dFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: effectiveTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = dFormatter.formatToParts(fromDate);
  const y = parseInt(parts.find((p) => p.type === 'year')?.value || '2026', 10);
  const m = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const d = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  // Candidate: Today at endH:endM in target timezone
  const candidateToday = createDateInTimezone(y, m, d, endH, endM, effectiveTz);

  if (candidateToday.getTime() > fromDate.getTime()) {
    return candidateToday;
  }

  // Candidate: Tomorrow at endH:endM in target timezone
  const tomorrow = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowParts = dFormatter.formatToParts(tomorrow);
  const ty = parseInt(tomorrowParts.find((p) => p.type === 'year')?.value || '2026', 10);
  const tm = parseInt(tomorrowParts.find((p) => p.type === 'month')?.value || '1', 10);
  const td = parseInt(tomorrowParts.find((p) => p.type === 'day')?.value || '1', 10);

  return createDateInTimezone(ty, tm, td, endH, endM, effectiveTz);
}

/**
 * Parses deadline & scheduledTime strings into an absolute Date object.
 * Handles ISO strings, '08:00 AM', 'Tomorrow 08:00 AM', etc.
 */
export function parseTaskTriggerTime(
  deadline?: string,
  scheduledTime?: string,
  timezone?: string
): Date {
  const now = new Date();
  const effectiveTz = getEffectiveTimezone(timezone);

  // 1. If scheduledTime is provided
  if (scheduledTime) {
    // Check if it's already an ISO timestamp
    const parsedIso = Date.parse(scheduledTime);
    if (!isNaN(parsedIso) && scheduledTime.includes('T')) {
      return new Date(parsedIso);
    }

    // Check for "Tomorrow" in scheduledTime
    const isTomorrow = scheduledTime.toLowerCase().includes('tomorrow');
    const timeOnlyStr = scheduledTime.replace(/tomorrow/i, '').trim();

    // Match "HH:MM AM/PM" or "HH:MM"
    const match12 = timeOnlyStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const meridian = match12[3]?.toUpperCase();

      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;

      const dFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      
      const baseDate = isTomorrow ? new Date(now.getTime() + 24 * 3600 * 1000) : now;
      const parts = dFormatter.formatToParts(baseDate);
      const y = parseInt(parts.find((p) => p.type === 'year')?.value || '2026', 10);
      const m = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
      const d = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
      
      const trigger = createDateInTimezone(y, m, d, hours, minutes, effectiveTz);

      // If scheduled today but time has already passed and not explicitly marked 'tomorrow', schedule 5m from now
      if (!isTomorrow && trigger.getTime() < now.getTime()) {
        return new Date(now.getTime() + 5 * 60 * 1000);
      }
      return trigger;
    }
  }

  // 2. If deadline is provided
  if (deadline) {
    const parsedDeadline = Date.parse(deadline);
    if (!isNaN(parsedDeadline)) {
      // Set reminder 30 minutes before deadline
      const targetTime = parsedDeadline - 30 * 60 * 1000;
      return targetTime > now.getTime() ? new Date(targetTime) : new Date(now.getTime() + 5 * 60 * 1000);
    }
  }

  // Default fallback: 1 hour from now
  return new Date(now.getTime() + 60 * 60 * 1000);
}
