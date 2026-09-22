import { NudgeTask } from '../types';

export const formatDateToIso = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseIsoToDate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const getTodayIso = (): string => {
  return formatDateToIso(new Date());
};

export const getOffsetIso = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return formatDateToIso(d);
};

export const isRepeatingTask = (task: NudgeTask | { repeat?: string }): boolean => {
  if (!task.repeat) return false;
  const rule = task.repeat.trim().toLowerCase();
  return (
    rule !== '' &&
    rule !== 'does not repeat' &&
    rule !== 'once' &&
    rule !== 'never'
  );
};

/**
 * Determines whether a recurring or one-time task occurs on a specific ISO date (YYYY-MM-DD).
 */
export const doesTaskOccurOnDate = (task: NudgeTask, targetDateIso: string): boolean => {
  if (task.isDeleted) return false;

  const targetDate = parseIsoToDate(targetDateIso);
  const todayIso = getTodayIso();
  const tomorrowIso = getOffsetIso(1);

  if (!isRepeatingTask(task)) {
    // Non-repeating / one-time task
    if (task.dateLabel === 'Today' || task.dateLabel === 'Tonight') {
      return targetDateIso === (task.startDate || todayIso);
    }
    if (task.dateLabel === 'Tomorrow') {
      // If task was created with dateLabel Tomorrow, target is tomorrow
      const taskBaseDate = task.startDate ? parseIsoToDate(task.startDate) : new Date();
      const nextDay = new Date(taskBaseDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return (
        targetDateIso === formatDateToIso(nextDay) ||
        targetDateIso === task.startDate ||
        targetDateIso === tomorrowIso
      );
    }
    if (task.startDate && task.startDate === targetDateIso) {
      return true;
    }
    // Fallback: if dateLabel matches exactly the target date
    if (task.dateLabel === targetDateIso) {
      return true;
    }
    return false;
  }

  // Repeating task logic
  const startDateIso = task.startDate || todayIso;
  const startDate = parseIsoToDate(startDateIso);

  // If target date is before recurrence start date, it does not occur yet
  if (targetDate.getTime() < startDate.getTime()) {
    return false;
  }

  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return false;

  const rule = task.repeat.trim().toLowerCase();

  // Daily: Every day or Daily
  if (rule === 'every day' || rule === 'daily') {
    return true;
  }

  // Weekdays (Monday to Friday: 1 - 5)
  if (rule.startsWith('weekday')) {
    const dayOfWeek = targetDate.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  // Weekends (Saturday = 6, Sunday = 0)
  if (rule.startsWith('weekend')) {
    const dayOfWeek = targetDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // Weekly: Every week or Weekly
  if (rule === 'every week' || rule === 'weekly') {
    return diffDays % 7 === 0;
  }

  // Monthly: Every month or Monthly
  if (rule === 'every month' || rule === 'monthly') {
    return targetDate.getDate() === startDate.getDate();
  }

  // Custom regex: "Every X days/weeks/months/years"
  const customPattern = /^every\s+(\d+)\s*(days?|weeks?|months?|years?)$/i;
  const match = customPattern.exec(rule);
  if (match) {
    const count = parseInt(match[1], 10);
    if (count <= 0 || isNaN(count)) return false;
    const unit = match[2].toLowerCase();

    if (unit.startsWith('day')) {
      return diffDays % count === 0;
    }
    if (unit.startsWith('week')) {
      return diffDays % (count * 7) === 0;
    }
    if (unit.startsWith('month')) {
      if (targetDate.getDate() !== startDate.getDate()) return false;
      const monthDiff =
        (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
        (targetDate.getMonth() - startDate.getMonth());
      return monthDiff >= 0 && monthDiff % count === 0;
    }
    if (unit.startsWith('year')) {
      return (
        targetDate.getDate() === startDate.getDate() &&
        targetDate.getMonth() === startDate.getMonth() &&
        (targetDate.getFullYear() - startDate.getFullYear()) % count === 0
      );
    }
  }

  return false;
};

/**
 * Checks if a task is marked complete for a specific date.
 * For repeating tasks, checks whether targetDateIso is in task.completedDates.
 * For one-time tasks, checks task.isDone.
 */
export const isTaskCompletedOnDate = (task: NudgeTask, targetDateIso: string): boolean => {
  if (isRepeatingTask(task)) {
    return Array.isArray(task.completedDates) && task.completedDates.includes(targetDateIso);
  }
  return !!task.isDone;
};

/**
 * Returns the human-readable repeat label badge (e.g. "Every day", "Every 2 days").
 */
export const getRepeatLabel = (repeatRule: string): string => {
  if (!repeatRule || repeatRule === 'Does not repeat') return '';
  return repeatRule;
};
