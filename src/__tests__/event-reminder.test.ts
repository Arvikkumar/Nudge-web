import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  findDueEventReminders,
  formatEventTiming,
  getDaysBeforeFromSetting,
  markEventReminderDelivered,
  unmarkEventReminderDelivered,
  clearAllDeliveredEventReminders,
  STORAGE_KEY_DELIVERED_EVENTS,
} from '../utils/eventReminderScheduler';
import { NudgeSettings } from '../types';
import { getSettings, saveSettings } from '../db/nudgeDb';

describe('Global Event / Observance Reminder Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllDeliveredEventReminders();
  });

  const baseSettings: NudgeSettings = {
    themeMode: 'system',
    notificationsEnabled: true,
    nudgeAgainEnabled: true,
    defaultSnooze: '30m',
    eventReminderOption: 'off',
    eventReminderCustomDays: 3,
  };

  it('correctly maps reminder options to day intervals', () => {
    expect(getDaysBeforeFromSetting('off')).toBeNull();
    expect(getDaysBeforeFromSetting('1_day')).toBe(1);
    expect(getDaysBeforeFromSetting('2_days')).toBe(2);
    expect(getDaysBeforeFromSetting('custom', 4)).toBe(4);
    expect(getDaysBeforeFromSetting('custom', 0)).toBe(1); // Minimum is 1 day
    expect(getDaysBeforeFromSetting('custom', 14)).toBe(14);
  });

  it('correctly formats event timing strings', () => {
    expect(formatEventTiming(1, 9, 21)).toBe('Tomorrow · September 21');
    expect(formatEventTiming(2, 9, 21)).toBe('In 2 days · September 21');
    expect(formatEventTiming(3, 9, 21)).toBe('In 3 days · September 21');
    expect(formatEventTiming(0, 9, 21)).toBe('Today · September 21');
    expect(formatEventTiming(1, 1, 1)).toBe('Tomorrow · January 1');
  });

  it('returns no reminders when option is Off', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: 'off',
    };

    // Reference date: Sep 20, 2026 (1 day before International Day of Peace on Sep 21)
    const refDate = new Date(2026, 8, 20); // 0-indexed month 8 = September
    const due = findDueEventReminders(settings, refDate);
    expect(due).toEqual([]);
  });

  it('finds 1-day before reminder on September 20 for International Day of Peace on September 21', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: '1_day',
    };

    // Reference date: Sep 20, 2026
    const refDate = new Date(2026, 8, 20);
    const due = findDueEventReminders(settings, refDate);

    expect(due.length).toBeGreaterThan(0);
    const peaceEvent = due.find((d) => d.event.id === 'fix_sep_21');
    expect(peaceEvent).toBeDefined();
    expect(peaceEvent?.event.name).toBe('International Day of Peace');
    expect(peaceEvent?.timingLabel).toBe('Tomorrow · September 21');
    expect(peaceEvent?.targetYear).toBe(2026);
    expect(peaceEvent?.targetMonth).toBe(9);
    expect(peaceEvent?.targetDay).toBe(21);
  });

  it('finds 2-day before reminder on September 19 for International Day of Peace on September 21', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: '2_days',
    };

    // Reference date: Sep 19, 2026
    const refDate = new Date(2026, 8, 19);
    const due = findDueEventReminders(settings, refDate);

    expect(due.length).toBeGreaterThan(0);
    const peaceEvent = due.find((d) => d.event.id === 'fix_sep_21');
    expect(peaceEvent).toBeDefined();
    expect(peaceEvent?.event.name).toBe('International Day of Peace');
    expect(peaceEvent?.timingLabel).toBe('In 2 days · September 21');
  });

  it('finds Custom reminder (e.g. 5 days before on Sep 16 for Sep 21)', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: 'custom',
      eventReminderCustomDays: 5,
    };

    // Reference date: Sep 16, 2026 -> +5 days is Sep 21
    const refDate = new Date(2026, 8, 16);
    const due = findDueEventReminders(settings, refDate);

    expect(due.length).toBeGreaterThan(0);
    const peaceEvent = due.find((d) => d.event.id === 'fix_sep_21');
    expect(peaceEvent).toBeDefined();
    expect(peaceEvent?.timingLabel).toBe('In 5 days · September 21');
  });

  it('prevents duplicate reminders for the same event once marked delivered', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: '1_day',
    };

    const refDate = new Date(2026, 8, 20);
    const initialDue = findDueEventReminders(settings, refDate);
    expect(initialDue.length).toBeGreaterThan(0);

    const firstItem = initialDue[0];
    markEventReminderDelivered(firstItem.occurrenceKey);

    // Second check on the same day should no longer include firstItem
    const secondDue = findDueEventReminders(settings, refDate);
    expect(secondDue.some((d) => d.occurrenceKey === firstItem.occurrenceKey)).toBe(false);

    // Unmarking allows re-delivery (e.g. if testing or reset)
    unmarkEventReminderDelivered(firstItem.occurrenceKey);
    const thirdDue = findDueEventReminders(settings, refDate);
    expect(thirdDue.some((d) => d.occurrenceKey === firstItem.occurrenceKey)).toBe(true);
  });

  it('handles year boundaries correctly (e.g. Dec 31 to Jan 1 New Year)', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: '1_day',
    };

    // Reference date: December 31, 2026
    const refDate = new Date(2026, 11, 31);
    const due = findDueEventReminders(settings, refDate);

    expect(due.length).toBeGreaterThan(0);
    const newYear = due.find((d) => d.event.id === 'fix_jan_01');
    expect(newYear).toBeDefined();
    expect(newYear?.event.name).toBe("New Year's Day");
    expect(newYear?.targetYear).toBe(2027); // Seamless transition into next year!
    expect(newYear?.targetMonth).toBe(1);
    expect(newYear?.targetDay).toBe(1);
    expect(newYear?.timingLabel).toBe('Tomorrow · January 1');
  });

  it('handles month boundaries correctly (e.g. April 30 to May 1)', () => {
    const settings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: '1_day',
    };

    // Reference date: April 30, 2026 -> +1 day is May 1
    const refDate = new Date(2026, 3, 30);
    const due = findDueEventReminders(settings, refDate);

    expect(due.length).toBeGreaterThan(0);
    const mayDay = due.find((d) => d.event.id === 'fix_may_01');
    expect(mayDay).toBeDefined();
    expect(mayDay?.timingLabel).toBe('Tomorrow · May 1');
  });

  it('persists event reminder settings across sessions', async () => {
    const newSettings: NudgeSettings = {
      ...baseSettings,
      eventReminderOption: '2_days',
      eventReminderCustomDays: 4,
    };

    await saveSettings(newSettings);

    const loaded = await getSettings();
    expect(loaded.eventReminderOption).toBe('2_days');
    expect(loaded.eventReminderCustomDays).toBe(4);
  });
});
