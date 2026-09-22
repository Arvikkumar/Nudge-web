import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDeepDiveState,
  saveDeepDiveState,
  startDeepDiveSession,
  endDeepDiveSession,
  markDeepDiveCompleted,
  dismissDeepDiveCompletion,
  formatTimeRemaining,
  formatClockTime,
  formatDurationLabel,
} from '../utils/deepDive';

describe('Deep Dive Focus Session Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with default inactive state when storage is empty', () => {
    const state = getDeepDiveState();
    expect(state.isActive).toBe(false);
    expect(state.durationMinutes).toBe(30);
    expect(state.notificationStyle).toBe('One Shot');
    expect(state.reminderPoints).toEqual([]);
    expect(state.completedAtMillis).toBeNull();
  });

  it('starts a new deep dive session and saves to localStorage', () => {
    const now = 1000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const endTime = now + 45 * 60 * 1000;
    const reminders = [
      { id: 'rem1', triggerTimeMillis: now + 30 * 60 * 1000, label: '15m remaining' },
    ];

    const state = startDeepDiveSession(endTime, 45, 'Full Ringtone', reminders);

    expect(state.isActive).toBe(true);
    expect(state.startedAtMillis).toBe(now);
    expect(state.endTimeMillis).toBe(endTime);
    expect(state.durationMinutes).toBe(45);
    expect(state.notificationStyle).toBe('Full Ringtone');
    expect(state.reminderPoints.length).toBe(1);

    // Verify localStorage persistence
    const loaded = getDeepDiveState();
    expect(loaded.isActive).toBe(true);
    expect(loaded.endTimeMillis).toBe(endTime);
  });

  it('ends a session early and clears active state', () => {
    const now = 2000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    startDeepDiveSession(now + 30 * 60 * 1000, 30, 'One Shot');
    expect(getDeepDiveState().isActive).toBe(true);

    const ended = endDeepDiveSession();
    expect(ended.isActive).toBe(false);
    expect(ended.endTimeMillis).toBe(0);

    const loaded = getDeepDiveState();
    expect(loaded.isActive).toBe(false);
  });

  it('marks a session completed upon timer expiry and tracks completion', () => {
    const now = 3000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    startDeepDiveSession(now + 30 * 60 * 1000, 30, 'One Shot');

    const completed = markDeepDiveCompleted();
    expect(completed.isActive).toBe(false);
    expect(completed.completedAtMillis).toBe(now);
    expect(completed.isCompletedDismissed).toBe(false);

    const dismissed = dismissDeepDiveCompletion();
    expect(dismissed.isCompletedDismissed).toBe(true);
  });

  it('correctly formats remaining time countdown', () => {
    const target = 100000;
    expect(formatTimeRemaining(target, 40000)).toBe('1m left'); // 60 seconds
    expect(formatTimeRemaining(target, 95000)).toBe('5s left'); // 5 seconds
    expect(formatTimeRemaining(target, 100000)).toBe('0m left');
    expect(formatTimeRemaining(target, 110000)).toBe('0m left'); // expired
  });

  it('correctly formats duration labels', () => {
    expect(formatDurationLabel(30)).toBe('30 minutes');
    expect(formatDurationLabel(60)).toBe('1 hour');
    expect(formatDurationLabel(90)).toBe('1h 30m');
    expect(formatDurationLabel(120)).toBe('2 hours');
  });
});
