/**
 * Browser Notification & Task Reminder Scheduler
 * Handles reminder timing, permissions, Web Notifications API, and chime audio.
 */

import { NudgeTask } from '../types';
import { playGentleChime } from './audioChime';
import { doesTaskOccurOnDate, getTodayIso, formatDateToIso } from './recurrence';

const STORAGE_KEY_DELIVERED = 'nudge_delivered_task_reminders';

export interface DueTaskReminder {
  task: NudgeTask;
  triggerMillis: number;
  occurrenceKey: string;
}

/**
 * Returns the current Notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser notification permission with user gesture.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Parses time label (e.g. "9:00 AM", "2:30 PM", "14:00") into hour and minute.
 */
export function parseTimeLabel(timeLabel?: string): { hour: number; minute: number } | null {
  if (!timeLabel || timeLabel.trim().toLowerCase() === 'any time') {
    return null;
  }

  const clean = timeLabel.replace(/morning|afternoon|evening|night/gi, '').trim();

  // Match formats like "9:30 AM", "9 AM", "14:00", "09:30"
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] ? match[3].toLowerCase() : null;

  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Calculates the next trigger timestamp in milliseconds for a task occurrence today or specific date.
 */
export function calculateTaskTriggerMillis(
  task: NudgeTask,
  targetDateIso: string = getTodayIso()
): number | null {
  if (!task.timeLabel || task.timeLabel.toLowerCase() === 'any time') {
    return null;
  }

  const time = parseTimeLabel(task.timeLabel);
  if (!time) return null;

  const [yearStr, monthStr, dayStr] = targetDateIso.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const date = new Date(year, month, day, time.hour, time.minute, 0, 0);
  return date.getTime();
}

/**
 * Gets set of already delivered reminder keys.
 */
function getDeliveredKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELIVERED);
    if (!raw) return new Set();
    const parsed: string[] = JSON.parse(raw);
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

/**
 * Marks a reminder occurrence as delivered.
 */
export function markReminderDelivered(occurrenceKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeliveredKeys();
    current.add(occurrenceKey);

    // Prune if excessively large
    const arr = Array.from(current);
    const toSave = arr.length > 500 ? arr.slice(arr.length - 300) : arr;
    localStorage.setItem(STORAGE_KEY_DELIVERED, JSON.stringify(toSave));
  } catch {
    // Ignored
  }
}

/**
 * Unmarks a reminder delivery (e.g. when snoozing to allow next firing).
 */
export function unmarkReminderDelivered(occurrenceKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeliveredKeys();
    current.delete(occurrenceKey);
    localStorage.setItem(STORAGE_KEY_DELIVERED, JSON.stringify(Array.from(current)));
  } catch {
    // Ignored
  }
}

/**
 * Evaluates all active tasks and returns those due right now that have not been delivered.
 */
export function findDueReminders(
  tasks: NudgeTask[],
  now: number = Date.now(),
  targetDateIso: string = getTodayIso()
): DueTaskReminder[] {
  const delivered = getDeliveredKeys();
  const due: DueTaskReminder[] = [];

  for (const task of tasks) {
    if (task.isDeleted) continue;

    // Check if task occurs today
    if (!doesTaskOccurOnDate(task, targetDateIso)) continue;

    // Check if task is already completed for today
    const isCompleted = task.repeat && task.repeat !== 'Does not repeat'
      ? (task.completedDates || []).includes(targetDateIso)
      : task.isDone;

    if (isCompleted) continue;

    const trigger = calculateTaskTriggerMillis(task, targetDateIso);
    if (!trigger) continue;

    const occurrenceKey = `${task.id}_${targetDateIso}_${trigger}`;

    // If trigger time has arrived (within the past 24 hours to avoid ancient stale tasks)
    // and not yet marked delivered
    const isDue = now >= trigger && (now - trigger) < 24 * 60 * 60 * 1000;

    if (isDue && !delivered.has(occurrenceKey)) {
      due.push({
        task,
        triggerMillis: trigger,
        occurrenceKey,
      });
    }
  }

  return due;
}

/**
 * Sends a browser notification for a due task.
 */
export function sendBrowserTaskNotification(task: NudgeTask, triggerMillis: number): void {
  if (typeof window === 'undefined') return;

  // Play peaceful chime
  playGentleChime('gentle');

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const timeStr = task.timeLabel ? ` at ${task.timeLabel}` : '';
      const notification = new Notification(task.title, {
        body: `Gentle reminder${timeStr} · ${task.category || 'Nudge'}`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232E62F6'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z'/></svg>",
        tag: `nudge_task_${task.id}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn('Browser notification error:', err);
    }
  }
}
