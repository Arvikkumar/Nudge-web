import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTimeLabel,
  calculateTaskTriggerMillis,
  findDueReminders,
  markReminderDelivered,
  unmarkReminderDelivered,
} from '../utils/reminderScheduler';
import { NudgeTask } from '../types';

describe('Task Reminder Scheduler Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly parses 12-hour and 24-hour time labels', () => {
    expect(parseTimeLabel('9:00 AM')).toEqual({ hour: 9, minute: 0 });
    expect(parseTimeLabel('9:30 AM')).toEqual({ hour: 9, minute: 30 });
    expect(parseTimeLabel('12:00 PM')).toEqual({ hour: 12, minute: 0 });
    expect(parseTimeLabel('1:45 PM')).toEqual({ hour: 13, minute: 45 });
    expect(parseTimeLabel('12:00 AM')).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeLabel('Any time')).toBeNull();
    expect(parseTimeLabel('')).toBeNull();
  });

  it('calculates trigger timestamp for a task on a target date', () => {
    const task: NudgeTask = {
      id: 1,
      title: 'Water plants',
      timeLabel: '2:30 PM',
      dateLabel: 'Today',
      startDate: '2026-05-15',
      category: 'Care',
      priority: 'Normal',
      isDone: false,
      repeat: 'Does not repeat',
      isDeleted: false,
      completedDates: [],
      createdAt: 1000,
      completedAt: null,
      deletedAt: null,
    };

    const trigger = calculateTaskTriggerMillis(task, '2026-05-15');
    expect(trigger).not.toBeNull();

    const date = new Date(trigger!);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4); // 0-indexed May
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it('detects due task reminders and avoids re-delivering', () => {
    const targetDateIso = '2026-05-15';
    const task: NudgeTask = {
      id: 42,
      title: 'Take vitamin',
      timeLabel: '10:00 AM',
      dateLabel: 'Today',
      startDate: targetDateIso,
      category: 'Health',
      priority: 'Important',
      isDone: false,
      repeat: 'Does not repeat',
      isDeleted: false,
      completedDates: [],
      createdAt: 1000,
      completedAt: null,
      deletedAt: null,
    };

    const trigger = calculateTaskTriggerMillis(task, targetDateIso)!;

    // Check before trigger time: not due
    const beforeTrigger = findDueReminders([task], trigger - 60000, targetDateIso);
    expect(beforeTrigger.length).toBe(0);

    // Check at trigger time: due!
    const atTrigger = findDueReminders([task], trigger + 1000, targetDateIso);
    expect(atTrigger.length).toBe(1);
    expect(atTrigger[0].task.id).toBe(42);

    // Mark delivered
    markReminderDelivered(atTrigger[0].occurrenceKey);

    // Check again at trigger time: should now be filtered out
    const afterDelivered = findDueReminders([task], trigger + 5000, targetDateIso);
    expect(afterDelivered.length).toBe(0);

    // Unmark delivered (e.g. after snooze): becomes available again
    unmarkReminderDelivered(atTrigger[0].occurrenceKey);
    const afterUnmarked = findDueReminders([task], trigger + 5000, targetDateIso);
    expect(afterUnmarked.length).toBe(1);
  });

  it('ignores completed and deleted tasks for reminders', () => {
    const targetDateIso = '2026-05-15';
    const completedTask: NudgeTask = {
      id: 101,
      title: 'Done task',
      timeLabel: '10:00 AM',
      dateLabel: 'Today',
      startDate: targetDateIso,
      category: 'Health',
      priority: 'Normal',
      isDone: true,
      repeat: 'Does not repeat',
      isDeleted: false,
      completedDates: [],
      createdAt: 1000,
      completedAt: 1000,
      deletedAt: null,
    };

    const deletedTask: NudgeTask = {
      id: 102,
      title: 'Deleted task',
      timeLabel: '10:00 AM',
      dateLabel: 'Today',
      startDate: targetDateIso,
      category: 'Health',
      priority: 'Normal',
      isDone: false,
      repeat: 'Does not repeat',
      isDeleted: true,
      completedDates: [],
      createdAt: 1000,
      completedAt: null,
      deletedAt: 1000,
    };

    const trigger = calculateTaskTriggerMillis(completedTask, targetDateIso)!;
    const due = findDueReminders([completedTask, deletedTask], trigger + 1000, targetDateIso);
    expect(due.length).toBe(0);
  });
});
