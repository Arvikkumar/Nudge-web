import { NudgeTask } from '../types';
import {
  getTodayIso,
  getOffsetIso,
  doesTaskOccurOnDate,
  isRepeatingTask,
  isTaskCompletedOnDate,
  parseIsoToDate,
} from './recurrence';

export type TaskFilterOption =
  | 'All'
  | 'Active'
  | 'Completed'
  | 'Personal'
  | 'Work'
  | 'Home'
  | 'Shopping'
  | 'Important';

export const TASK_FILTER_OPTIONS: TaskFilterOption[] = [
  'All',
  'Active',
  'Completed',
  'Personal',
  'Work',
  'Home',
  'Shopping',
  'Important',
];

const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Checks whether a single search term matches any property of a task.
 */
function termMatchesTask(task: NudgeTask, term: string, todayIso: string): boolean {
  if (!term) return true;

  // 1. Task Title
  if (task.title && task.title.toLowerCase().includes(term)) {
    return true;
  }

  // 2. Note Content / Description if available
  const content =
    (task as any).content || (task as any).description || (task as any).note;
  if (typeof content === 'string' && content.toLowerCase().includes(term)) {
    return true;
  }

  // 3. Category
  if (task.category && task.category.toLowerCase().includes(term)) {
    return true;
  }

  // 4. Priority
  if (task.priority) {
    if (task.priority.toLowerCase().includes(term)) {
      return true;
    }
    if (term === 'urgent' && task.priority === 'Important') {
      return true;
    }
  }

  // 5. Time label (e.g. "Morning", "Tonight", "2:30 PM", "Any time")
  if (task.timeLabel && task.timeLabel.toLowerCase().includes(term)) {
    return true;
  }

  // 6. Recurrence information (e.g. "Every day", "Every 2 days", "Weekdays", "Every week", "Every month")
  if (task.repeat) {
    const repeatLower = task.repeat.toLowerCase();
    if (repeatLower.includes(term)) {
      return true;
    }
    // Synonyms for recurrence
    if (term === 'daily' && (repeatLower === 'every day' || repeatLower.includes('every day'))) {
      return true;
    }
    if (term === 'weekly' && (repeatLower === 'every week' || repeatLower.includes('week'))) {
      return true;
    }
    if (term === 'monthly' && (repeatLower === 'every month' || repeatLower.includes('month'))) {
      return true;
    }
    if (
      (term === 'repeating' || term === 'recurring' || term === 'repeat') &&
      isRepeatingTask(task)
    ) {
      return true;
    }
  }

  // 7. Date Label & Start Date
  if (task.dateLabel && task.dateLabel.toLowerCase().includes(term)) {
    return true;
  }
  if (task.startDate && task.startDate.toLowerCase().includes(term)) {
    return true;
  }

  // 8. Semantic Date Matching for tasks scheduled on specific relative days
  const tomorrowIso = getOffsetIso(1);
  const yesterdayIso = getOffsetIso(-1);

  if (term === 'today') {
    if (
      task.dateLabel?.toLowerCase().includes('today') ||
      task.startDate === todayIso
    ) {
      return true;
    }
  }

  if (term === 'tomorrow') {
    if (
      task.dateLabel?.toLowerCase().includes('tomorrow') ||
      task.startDate === tomorrowIso
    ) {
      return true;
    }
  }

  if (term === 'yesterday') {
    if (
      task.dateLabel?.toLowerCase().includes('yesterday') ||
      task.startDate === yesterdayIso
    ) {
      return true;
    }
  }

  // Common synonym expansion: "doctor" / "dentist" / "dr"
  if (term === 'doctor' || term === 'dr' || term === 'dentist') {
    const titleLower = (task.title || '').toLowerCase();
    if (
      titleLower.includes('doctor') ||
      titleLower.includes('dr.') ||
      titleLower.includes('dentist') ||
      titleLower.includes('clinic') ||
      titleLower.includes('appointment')
    ) {
      return true;
    }
  }

  // Weekday matching (e.g., "monday", "friday")
  const weekdayIndex = WEEKDAY_NAMES.indexOf(term);
  if (weekdayIndex !== -1) {
    if (task.repeat === 'Weekdays' && weekdayIndex >= 1 && weekdayIndex <= 5) {
      return true;
    }
    if (task.repeat === 'Every day') {
      return true;
    }
    if (task.startDate) {
      const taskDate = parseIsoToDate(task.startDate);
      if (taskDate.getDay() === weekdayIndex) {
        return true;
      }
    }
  }

  // Month names matching against startDate (e.g., "september", "sep")
  if (task.startDate) {
    const taskDate = parseIsoToDate(task.startDate);
    const monthFull = taskDate
      .toLocaleString('en-US', { month: 'long' })
      .toLowerCase();
    const monthShort = taskDate
      .toLocaleString('en-US', { month: 'short' })
      .toLowerCase();
    if (monthFull.includes(term) || monthShort.includes(term)) {
      return true;
    }
  }

  return false;
}

/**
 * Searches a task against a search query.
 * Multi-word queries require all tokens to match some field of the task.
 */
export function matchesTaskSearch(
  task: NudgeTask,
  query: string,
  todayIso: string = getTodayIso()
): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  // Split query into terms so "work doctor" or "important meeting" matches both
  const terms = trimmed.split(/\s+/).filter(Boolean);
  return terms.every((term) => termMatchesTask(task, term, todayIso));
}

/**
 * Checks whether a task matches the chosen filter option.
 */
export function matchesTaskFilter(
  task: NudgeTask,
  filter: TaskFilterOption,
  occurrenceDateIso: string = getTodayIso()
): boolean {
  switch (filter) {
    case 'All':
      return true;
    case 'Active':
      return !isTaskCompletedOnDate(task, occurrenceDateIso);
    case 'Completed':
      return isTaskCompletedOnDate(task, occurrenceDateIso);
    case 'Personal':
    case 'Work':
    case 'Home':
    case 'Shopping':
      return task.category.toLowerCase() === filter.toLowerCase();
    case 'Important':
      return task.priority === 'Important';
    default:
      return true;
  }
}

/**
 * Combined search and filter evaluator for tasks.
 */
export function filterNudgeTask(
  task: NudgeTask,
  query: string,
  filter: TaskFilterOption,
  occurrenceDateIso: string = getTodayIso()
): boolean {
  return (
    matchesTaskFilter(task, filter, occurrenceDateIso) &&
    matchesTaskSearch(task, query, occurrenceDateIso)
  );
}

/**
 * Notes search evaluator.
 * Searches across note title, note content, category, and date/priority attributes.
 */
export function matchesNoteSearch(
  note: NudgeTask,
  query: string,
  categoryFilter: string = 'All',
  todayIso: string = getTodayIso()
): boolean {
  // Category check
  if (categoryFilter !== 'All') {
    if (note.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
  }

  // Query check
  return matchesTaskSearch(note, query, todayIso);
}
