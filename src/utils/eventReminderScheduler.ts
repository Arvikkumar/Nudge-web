/**
 * Global Event & Important Observance Reminder Scheduler
 * Handles date computation, anniversary matching, delivered key deduplication,
 * year/month boundary math, and notification dispatch for Nudge observances.
 */

import { NudgeSettings, EventReminderOption } from '../types';
import { NudgeEvent, getEventsForDate } from './nudgeEvents';
import { playGentleChime } from './audioChime';

export const STORAGE_KEY_DELIVERED_EVENTS = 'nudge_delivered_event_reminders';

export interface DueEventReminder {
  event: NudgeEvent;
  eventDateIso: string; // YYYY-MM-DD
  targetYear: number;
  targetMonth: number;
  targetDay: number;
  daysBefore: number;
  occurrenceKey: string;
  timingLabel: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Maps the setting option to an integer number of days before.
 */
export function getDaysBeforeFromSetting(
  option?: EventReminderOption,
  customDays: number = 3
): number | null {
  if (!option || option === 'off') {
    return null;
  }
  if (option === '1_day') {
    return 1;
  }
  if (option === '2_days') {
    return 2;
  }
  if (option === 'custom') {
    const days = Math.floor(customDays);
    return Math.max(1, isNaN(days) ? 3 : days);
  }
  return null;
}

/**
 * Returns formatted timing label like "Tomorrow · September 21" or "In 2 days · September 21".
 */
export function formatEventTiming(daysBefore: number, month: number, day: number): string {
  const monthName = MONTH_NAMES[month - 1] || '';
  const dateStr = `${monthName} ${day}`;

  if (daysBefore === 1) {
    return `Tomorrow · ${dateStr}`;
  }
  if (daysBefore === 2) {
    return `In 2 days · ${dateStr}`;
  }
  if (daysBefore === 0) {
    return `Today · ${dateStr}`;
  }
  return `In ${daysBefore} days · ${dateStr}`;
}

/**
 * Retrieves previously delivered event keys from localStorage.
 */
export function getDeliveredEventKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELIVERED_EVENTS);
    if (!raw) return new Set();
    const list: string[] = JSON.parse(raw);
    return new Set(list);
  } catch {
    return new Set();
  }
}

/**
 * Marks an event occurrence as delivered to prevent duplicates.
 */
export function markEventReminderDelivered(occurrenceKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeliveredEventKeys();
    current.add(occurrenceKey);
    const arr = Array.from(current);
    // Keep max 500 records
    const toSave = arr.length > 500 ? arr.slice(arr.length - 300) : arr;
    localStorage.setItem(STORAGE_KEY_DELIVERED_EVENTS, JSON.stringify(toSave));
  } catch {
    // Ignored in non-storage environments
  }
}

/**
 * Unmarks a delivered key (useful when changing settings or resetting).
 */
export function unmarkEventReminderDelivered(occurrenceKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeliveredEventKeys();
    current.delete(occurrenceKey);
    localStorage.setItem(STORAGE_KEY_DELIVERED_EVENTS, JSON.stringify(Array.from(current)));
  } catch {
    // Ignored
  }
}

/**
 * Clears all delivered keys.
 */
export function clearAllDeliveredEventReminders(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_DELIVERED_EVENTS);
  } catch {
    // Ignored
  }
}

/**
 * Evaluates all existing observances and returns those due right now based on settings.
 * Correctly computes future event dates across month and year boundaries.
 */
export function findDueEventReminders(
  settings: NudgeSettings,
  referenceDate: Date = new Date()
): DueEventReminder[] {
  if (!settings.eventReminderOption || settings.eventReminderOption === 'off') {
    return [];
  }

  const daysBefore = getDaysBeforeFromSetting(
    settings.eventReminderOption,
    settings.eventReminderCustomDays
  );
  if (!daysBefore || daysBefore < 1) {
    return [];
  }

  const deliveredKeys = getDeliveredEventKeys();

  // Calculate target event date: reference date + daysBefore
  // Using native Date handles month rolls, leap years, and year-end rolls seamlessly
  const targetDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + daysBefore
  );

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1; // 1-12
  const targetDay = targetDate.getDate(); // 1-31

  const pad = (n: number) => String(n).padStart(2, '0');
  const eventDateIso = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;

  // Retrieve events from the existing master dataset
  const events = getEventsForDate(targetYear, targetMonth, targetDay);
  if (!events || events.length === 0) {
    return [];
  }

  const dueList: DueEventReminder[] = [];

  for (const evt of events) {
    // Occurrence key includes event ID, target year, and days-before setting
    const occurrenceKey = `event_${evt.id}_${targetYear}_${daysBefore}d`;
    if (!deliveredKeys.has(occurrenceKey)) {
      dueList.push({
        event: evt,
        eventDateIso,
        targetYear,
        targetMonth,
        targetDay,
        daysBefore,
        occurrenceKey,
        timingLabel: formatEventTiming(daysBefore, targetMonth, targetDay),
      });
    }
  }

  return dueList;
}

/**
 * Dispatches a native browser notification and gentle chime sound for an event reminder.
 */
export function sendBrowserEventNotification(reminder: DueEventReminder): void {
  if (typeof window === 'undefined') return;

  // Play gentle tranquil chime
  playGentleChime('gentle');

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(reminder.event.name, {
        body: `${reminder.timingLabel} · ${reminder.event.category}\n${reminder.event.description || ''}`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23D97706'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>",
        tag: `nudge_event_${reminder.event.id}_${reminder.targetYear}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn('Browser event notification error:', err);
    }
  }
}
