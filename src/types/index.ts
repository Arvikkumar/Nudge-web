export type NavView = 'today' | 'notes' | 'hours' | 'settings';

export type ThemeMode = 'system' | 'light' | 'dark';

export type TaskPriority = 'Normal' | 'Important';

export interface NudgeTask {
  id: number;
  title: string;
  timeLabel: string;
  dateLabel: string;
  category: string;
  priority: TaskPriority;
  repeat: string; // "Does not repeat", "Every day", "Every 2 days", "Weekdays", "Every week", "Every month"
  startDate: string; // "YYYY-MM-DD"
  completedDates: string[]; // List of "YYYY-MM-DD" occurrences marked complete
  isDone: boolean; // For one-time tasks or overall completion status
  createdAt: number;
  completedAt: number | null;
  isDeleted: boolean;
  deletedAt: number | null;
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface NavItemConfig {
  id: NavView;
  label: string;
  iconName: string;
}

export interface Pursuit {
  id: number;
  name: string;
  emoji: string;
  targetHours: number;
  loggedMinutes: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  isArchived: boolean;
  createdAt: number;
}

export interface TimeGoalRecord {
  id: number;
  pursuitId: number;
  date: string; // YYYY-MM-DD
  minutes: number;
  note?: string;
  createdAt: number;
}

export interface ActiveTimerState {
  pursuitId: number;
  isRunning: boolean;
  startedAt: number;
  accumulatedSeconds: number;
}

export type EventReminderOption = 'off' | '1_day' | '2_days' | 'custom';

export interface NudgeSettings {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  nudgeAgainEnabled: boolean;
  defaultSnooze: string; // '15m' | '30m' | '1 hour' | 'Tomorrow'
  eventReminderOption?: EventReminderOption;
  eventReminderCustomDays?: number;
}

export type { EventCategoryType, NudgeEvent } from '../utils/nudgeEvents';
