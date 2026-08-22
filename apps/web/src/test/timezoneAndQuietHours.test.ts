import { describe, it, expect } from 'vitest';
import {
  isWithinQuietHours,
  getNextQuietHoursEnd,
  parseTaskTriggerTime,
  getEffectiveTimezone,
  isValidTimezone,
} from '@saarathi/api';
import { QuietHoursConfig } from '@saarathi/types';

describe('Timezone & Quiet Hours Utilities', () => {
  it('should validate and get effective timezones', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Invalid/Fake_Tz')).toBe(false);

    expect(getEffectiveTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(getEffectiveTimezone('Invalid/Fake_Tz')).not.toBe('Invalid/Fake_Tz');
  });

  it('should correctly evaluate standard daytime quiet hours', () => {
    const config: QuietHoursConfig = {
      enabled: true,
      start: '13:00',
      end: '15:00',
    };

    // 14:00 UTC -> inside
    const insideDate = new Date('2026-08-22T14:00:00Z');
    expect(isWithinQuietHours(insideDate, config, 'UTC')).toBe(true);

    // 16:00 UTC -> outside
    const outsideDate = new Date('2026-08-22T16:00:00Z');
    expect(isWithinQuietHours(outsideDate, config, 'UTC')).toBe(false);
  });

  it('should correctly evaluate overnight quiet hours (e.g. 23:00 to 07:00)', () => {
    const overnightConfig: QuietHoursConfig = {
      enabled: true,
      start: '23:00',
      end: '07:00',
    };

    // 23:30 UTC -> inside
    const nightDate = new Date('2026-08-22T23:30:00Z');
    expect(isWithinQuietHours(nightDate, overnightConfig, 'UTC')).toBe(true);

    // 04:15 UTC -> inside
    const earlyMorningDate = new Date('2026-08-22T04:15:00Z');
    expect(isWithinQuietHours(earlyMorningDate, overnightConfig, 'UTC')).toBe(true);

    // 12:00 UTC -> outside
    const noonDate = new Date('2026-08-22T12:00:00Z');
    expect(isWithinQuietHours(noonDate, overnightConfig, 'UTC')).toBe(false);
  });

  it('should compute next quiet hours end correctly', () => {
    const config: QuietHoursConfig = {
      enabled: true,
      start: '23:00',
      end: '07:00',
    };

    const nightDate = new Date('2026-08-22T23:30:00Z');
    const endDate = getNextQuietHoursEnd(nightDate, config, 'UTC');

    expect(endDate.getUTCHours()).toBe(7);
    expect(endDate.getUTCMinutes()).toBe(0);
    expect(endDate.getTime()).toBeGreaterThan(nightDate.getTime());
  });

  it('should parse task trigger time for relative and scheduled formats', () => {
    // 1. Scheduled time format: '10:00 AM'
    const parsed10am = parseTaskTriggerTime(undefined, '10:00 AM', 'UTC');
    expect(parsed10am).toBeInstanceOf(Date);
    expect(!isNaN(parsed10am.getTime())).toBe(true);

    // 2. Deadline parsing (30m before deadline)
    const futureDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const parsedDeadline = parseTaskTriggerTime(futureDeadline, undefined, 'UTC');
    expect(parsedDeadline.getTime()).toBeLessThan(Date.parse(futureDeadline));
  });
});
