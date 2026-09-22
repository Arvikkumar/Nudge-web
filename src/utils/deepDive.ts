/**
 * Deep Dive Focus Session State & Helper Logic
 * Closely matching Android Nudge DeepDiveManager and DeepDiveCard behavior.
 */

import { playGentleChime } from './audioChime';

export interface DeepDiveReminderPoint {
  id: string;
  triggerTimeMillis: number;
  label: string; // e.g. "15m before end"
  subLabel?: string;
  notified?: boolean;
}

export interface DeepDiveState {
  isActive: boolean;
  endTimeMillis: number;
  startedAtMillis: number;
  durationMinutes: number;
  notificationStyle: 'One Shot' | 'Full Ringtone';
  reminderPoints: DeepDiveReminderPoint[];
  completedAtMillis: number | null;
  isCompletedDismissed?: boolean;
}

const STORAGE_KEY_STATE = 'nudge_deep_dive_state';
const DEFAULT_STYLE: 'One Shot' | 'Full Ringtone' = 'One Shot';

const DEFAULT_STATE: DeepDiveState = {
  isActive: false,
  endTimeMillis: 0,
  startedAtMillis: 0,
  durationMinutes: 30,
  notificationStyle: DEFAULT_STYLE,
  reminderPoints: [],
  completedAtMillis: null,
  isCompletedDismissed: true,
};

let beforeUnloadAttached = false;

function setupBeforeUnloadProtection(isActive: boolean) {
  if (typeof window === 'undefined') return;

  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = 'You have an active Deep Dive focus session in progress. Leave anyway?';
    return e.returnValue;
  };

  if (isActive && !beforeUnloadAttached) {
    window.addEventListener('beforeunload', handler);
    beforeUnloadAttached = true;
  } else if (!isActive && beforeUnloadAttached) {
    window.removeEventListener('beforeunload', handler);
    beforeUnloadAttached = false;
  }
}

/**
 * Retrieves the current persisted Deep Dive state.
 * If the session ended in the past, transitions it to completed.
 */
export function getDeepDiveState(): DeepDiveState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) return DEFAULT_STATE;

    const parsed: DeepDiveState = JSON.parse(raw);
    const now = Date.now();

    // If it was marked active but the timer has passed
    if (parsed.isActive && parsed.endTimeMillis > 0 && parsed.endTimeMillis <= now) {
      const completedState: DeepDiveState = {
        ...parsed,
        isActive: false,
        completedAtMillis: parsed.endTimeMillis,
        isCompletedDismissed: false,
      };
      saveDeepDiveState(completedState);
      return completedState;
    }

    setupBeforeUnloadProtection(parsed.isActive);
    return parsed;
  } catch (err) {
    console.error('Failed to parse Deep Dive state:', err);
    return DEFAULT_STATE;
  }
}

/**
 * Persists the Deep Dive state and broadcasts a change event.
 */
export function saveDeepDiveState(state: DeepDiveState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    setupBeforeUnloadProtection(state.isActive);
    window.dispatchEvent(new CustomEvent('nudge_deep_dive_change', { detail: state }));
  } catch (err) {
    console.error('Failed to save Deep Dive state:', err);
  }
}

/**
 * Starts a new Deep Dive session.
 */
export function startDeepDiveSession(
  targetEndTimeMillis: number,
  durationMinutes: number,
  notificationStyle: 'One Shot' | 'Full Ringtone' = 'One Shot',
  reminderPoints: DeepDiveReminderPoint[] = []
): DeepDiveState {
  const now = Date.now();
  const validReminders = reminderPoints
    .filter((r) => r.triggerTimeMillis > now && r.triggerTimeMillis < targetEndTimeMillis)
    .sort((a, b) => a.triggerTimeMillis - b.triggerTimeMillis);

  const newState: DeepDiveState = {
    isActive: true,
    endTimeMillis: targetEndTimeMillis,
    startedAtMillis: now,
    durationMinutes,
    notificationStyle,
    reminderPoints: validReminders,
    completedAtMillis: null,
    isCompletedDismissed: true,
  };

  saveDeepDiveState(newState);

  // Play subtle starting tone
  playGentleChime('subtle' as any);

  // Try showing start notification if permitted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification('Deep Dive Started', {
        body: `Focusing for ${formatDurationLabel(durationMinutes)} (until ${formatClockTime(targetEndTimeMillis)}).`,
        tag: 'nudge_deep_dive_status',
        silent: true,
      });
    } catch {
      // Ignored
    }
  }

  return newState;
}

/**
 * Ends active Deep Dive session early.
 */
export function endDeepDiveSession(): DeepDiveState {
  const prev = getDeepDiveState();
  const newState: DeepDiveState = {
    ...prev,
    isActive: false,
    endTimeMillis: 0,
    completedAtMillis: null,
    isCompletedDismissed: true,
  };
  saveDeepDiveState(newState);
  return newState;
}

/**
 * Completes the Deep Dive session upon timer expiration.
 */
export function markDeepDiveCompleted(): DeepDiveState {
  const prev = getDeepDiveState();
  const newState: DeepDiveState = {
    ...prev,
    isActive: false,
    completedAtMillis: Date.now(),
    isCompletedDismissed: false,
  };
  saveDeepDiveState(newState);

  // Play gentle completion chord
  playGentleChime('completion');

  // Trigger web notification if available
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification('Deep Dive Complete 🌿', {
        body: `You completed your ${formatDurationLabel(prev.durationMinutes || 30)} focus session. Well done.`,
        tag: 'nudge_deep_dive_finish',
        requireInteraction: false,
      });
    } catch {
      // Ignored
    }
  }

  return newState;
}

/**
 * Dismisses the completion dialog.
 */
export function dismissDeepDiveCompletion(): DeepDiveState {
  const prev = getDeepDiveState();
  const newState: DeepDiveState = {
    ...prev,
    completedAtMillis: null,
    isCompletedDismissed: true,
  };
  saveDeepDiveState(newState);
  return newState;
}

/**
 * Formats clock time (e.g. "10:30 AM", "4:15 PM").
 */
export function formatClockTime(millis: number): string {
  if (!millis) return '';
  const date = new Date(millis);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Formats time remaining until target millis (e.g. "24m left", "1h 12m left", "45s left").
 */
export function formatTimeRemaining(targetMillis: number, fromMillis: number = Date.now()): string {
  const remainingMillis = Math.max(0, targetMillis - fromMillis);
  if (remainingMillis <= 0) return '0m left';

  const totalSeconds = Math.ceil(remainingMillis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
  }
  if (minutes > 0) {
    return seconds > 0 && minutes < 5 ? `${minutes}m ${seconds}s left` : `${minutes}m left`;
  }
  return `${seconds}s left`;
}

/**
 * Formats duration label (e.g. 30 -> "30 minutes", 60 -> "1 hour", 90 -> "1h 30m").
 */
export function formatDurationLabel(minutes: number): string {
  if (minutes <= 0) return '0 minutes';
  if (minutes === 60) return '1 hour';
  if (minutes % 60 === 0) return `${minutes / 60} hours`;

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins} minutes`;
}
