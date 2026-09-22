/**
 * Nudge Web - Data Backup & Restore Utility
 * Provides safe export, strict validation, atomic restore, and clean data deletion.
 */

import {
  NudgeTask,
  Pursuit,
  TimeGoalRecord,
  NudgeSettings,
  ThemeMode,
  TaskPriority,
  EventReminderOption,
} from '../types';
import * as db from '../db/nudgeDb';

export interface NudgeBackupData {
  tasks: NudgeTask[];
  pursuits: Pursuit[];
  timeRecords: TimeGoalRecord[];
  settings: NudgeSettings;
  userName?: string;
  deliveredEventReminders?: string[];
}

export interface NudgeBackupFile {
  version: number;
  app: 'nudge-web';
  exportedAt: string;
  data: NudgeBackupData;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  data?: NudgeBackupData;
  summary?: {
    tasksCount: number;
    pursuitsCount: number;
    timeRecordsCount: number;
    userName?: string;
  };
}

/**
 * Creates a complete backup object of all persistent Nudge Web data.
 */
export async function createBackupFile(): Promise<NudgeBackupFile> {
  const [tasks, pursuits, timeRecords, settings] = await Promise.all([
    db.getRawTasks(),
    db.getRawPursuits(),
    db.getRawTimeRecords(),
    db.getSettings(),
  ]);

  let userName = 'Bloom';
  let deliveredReminders: string[] = [];

  if (typeof localStorage !== 'undefined') {
    const storedName = localStorage.getItem('nudge_user_name');
    if (storedName) userName = storedName;

    const storedDelivered = localStorage.getItem('nudge_delivered_event_reminders');
    if (storedDelivered) {
      try {
        deliveredReminders = JSON.parse(storedDelivered);
      } catch {
        deliveredReminders = [];
      }
    }
  }

  return {
    version: 1,
    app: 'nudge-web',
    exportedAt: new Date().toISOString(),
    data: {
      tasks,
      pursuits,
      timeRecords,
      settings,
      userName,
      deliveredEventReminders: deliveredReminders,
    },
  };
}

/**
 * Triggers a browser download of the Nudge backup file.
 */
export function downloadBackupFile(backup: NudgeBackupFile): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Nudge-Backup-${dateStr}.json`;

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Validates a parsed or raw backup JSON structure.
 * Prevents corrupted, malformed, or incompatible files from being imported.
 */
export function parseAndValidateBackupJson(rawInput: string | unknown): BackupValidationResult {
  let parsed: any;

  if (typeof rawInput === 'string') {
    if (!rawInput.trim()) {
      return {
        isValid: false,
        error: 'The selected backup file is empty.',
      };
    }
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      return {
        isValid: false,
        error: 'The file contains invalid or unreadable JSON syntax.',
      };
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      error: 'Backup file must contain a valid JSON object.',
    };
  }

  // App identifier check if specified
  if (parsed.app && parsed.app !== 'nudge-web') {
    return {
      isValid: false,
      error: `Unsupported backup file. Expected "nudge-web", but found "${parsed.app}".`,
    };
  }

  // Support both standard envelope { app, version, data: { ... } } and direct payload
  const payload = (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data))
    ? parsed.data
    : parsed;

  const hasTasks = Array.isArray(payload.tasks);
  const hasPursuits = Array.isArray(payload.pursuits);
  const hasTimeRecords = Array.isArray(payload.timeRecords);
  const hasSettings = payload.settings && typeof payload.settings === 'object';

  if (!hasTasks && !hasPursuits && !hasTimeRecords && !hasSettings) {
    return {
      isValid: false,
      error: 'The backup file does not contain recognizable Nudge Web data.',
    };
  }

  // Validate tasks if present
  const sanitizedTasks: NudgeTask[] = [];
  if (hasTasks) {
    for (let i = 0; i < payload.tasks.length; i++) {
      const item = payload.tasks[i];
      if (!item || typeof item !== 'object') {
        return {
          isValid: false,
          error: `Task at index ${i} is corrupted or missing required fields.`,
        };
      }
      if (typeof item.title !== 'string' || !item.title.trim()) {
        return {
          isValid: false,
          error: `Task at index ${i} is missing a valid title.`,
        };
      }

      sanitizedTasks.push({
        id: typeof item.id === 'number' ? item.id : Date.now() + i,
        title: item.title.trim(),
        timeLabel: typeof item.timeLabel === 'string' ? item.timeLabel : 'Any time',
        dateLabel: typeof item.dateLabel === 'string' ? item.dateLabel : 'Today',
        category: typeof item.category === 'string' ? item.category : 'Personal',
        priority: (item.priority === 'Important' ? 'Important' : 'Normal') as TaskPriority,
        repeat: typeof item.repeat === 'string' ? item.repeat : 'Does not repeat',
        startDate: typeof item.startDate === 'string' ? item.startDate : new Date().toISOString().split('T')[0],
        completedDates: Array.isArray(item.completedDates) ? item.completedDates : [],
        isDone: Boolean(item.isDone),
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        completedAt: typeof item.completedAt === 'number' ? item.completedAt : null,
        isDeleted: Boolean(item.isDeleted),
        deletedAt: typeof item.deletedAt === 'number' ? item.deletedAt : null,
      });
    }
  }

  // Validate pursuits if present
  const sanitizedPursuits: Pursuit[] = [];
  if (hasPursuits) {
    for (let i = 0; i < payload.pursuits.length; i++) {
      const item = payload.pursuits[i];
      if (!item || typeof item !== 'object') {
        return {
          isValid: false,
          error: `Time goal pursuit at index ${i} is invalid.`,
        };
      }
      if (typeof item.name !== 'string' || !item.name.trim()) {
        return {
          isValid: false,
          error: `Time goal pursuit at index ${i} is missing a name.`,
        };
      }

      sanitizedPursuits.push({
        id: typeof item.id === 'number' ? item.id : i + 1,
        name: item.name.trim(),
        emoji: typeof item.emoji === 'string' ? item.emoji : '🎯',
        targetHours: typeof item.targetHours === 'number' ? item.targetHours : 20,
        loggedMinutes: typeof item.loggedMinutes === 'number' ? item.loggedMinutes : 0,
        color: typeof item.color === 'string' ? item.color : 'bg-blue-500',
        badgeBg: typeof item.badgeBg === 'string' ? item.badgeBg : 'bg-blue-50 dark:bg-blue-950/40',
        badgeText: typeof item.badgeText === 'string' ? item.badgeText : 'text-blue-700 dark:text-blue-300',
        isArchived: Boolean(item.isArchived),
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      });
    }
  }

  // Validate time records if present
  const sanitizedTimeRecords: TimeGoalRecord[] = [];
  if (hasTimeRecords) {
    for (let i = 0; i < payload.timeRecords.length; i++) {
      const item = payload.timeRecords[i];
      if (!item || typeof item !== 'object') {
        return {
          isValid: false,
          error: `Time record at index ${i} is invalid.`,
        };
      }
      if (typeof item.pursuitId !== 'number' || typeof item.minutes !== 'number') {
        return {
          isValid: false,
          error: `Time record at index ${i} has invalid pursuit ID or duration minutes.`,
        };
      }

      sanitizedTimeRecords.push({
        id: typeof item.id === 'number' ? item.id : i + 1,
        pursuitId: item.pursuitId,
        date: typeof item.date === 'string' ? item.date : new Date().toISOString().split('T')[0],
        minutes: item.minutes,
        note: typeof item.note === 'string' ? item.note : undefined,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      });
    }
  }

  // Validate settings if present (fallback to defaults if missing)
  const defaultSettings: NudgeSettings = {
    themeMode: 'system',
    notificationsEnabled: true,
    nudgeAgainEnabled: true,
    defaultSnooze: '30m',
    eventReminderOption: 'off',
    eventReminderCustomDays: 3,
  };

  const rawSettings = payload.settings || {};
  const validThemes: ThemeMode[] = ['system', 'light', 'dark'];
  const validEventOpts: EventReminderOption[] = ['off', '1_day', '2_days', 'custom'];

  const sanitizedSettings: NudgeSettings = {
    themeMode: validThemes.includes(rawSettings.themeMode) ? rawSettings.themeMode : defaultSettings.themeMode,
    notificationsEnabled: typeof rawSettings.notificationsEnabled === 'boolean'
      ? rawSettings.notificationsEnabled
      : defaultSettings.notificationsEnabled,
    nudgeAgainEnabled: typeof rawSettings.nudgeAgainEnabled === 'boolean'
      ? rawSettings.nudgeAgainEnabled
      : defaultSettings.nudgeAgainEnabled,
    defaultSnooze: typeof rawSettings.defaultSnooze === 'string'
      ? rawSettings.defaultSnooze
      : defaultSettings.defaultSnooze,
    eventReminderOption: validEventOpts.includes(rawSettings.eventReminderOption)
      ? rawSettings.eventReminderOption
      : defaultSettings.eventReminderOption,
    eventReminderCustomDays: typeof rawSettings.eventReminderCustomDays === 'number'
      ? rawSettings.eventReminderCustomDays
      : defaultSettings.eventReminderCustomDays,
  };

  const sanitizedUserName = typeof payload.userName === 'string' && payload.userName.trim()
    ? payload.userName.trim()
    : undefined;

  const sanitizedDeliveredReminders = Array.isArray(payload.deliveredEventReminders)
    ? payload.deliveredEventReminders.filter((k: unknown) => typeof k === 'string')
    : undefined;

  return {
    isValid: true,
    data: {
      tasks: sanitizedTasks,
      pursuits: sanitizedPursuits,
      timeRecords: sanitizedTimeRecords,
      settings: sanitizedSettings,
      userName: sanitizedUserName,
      deliveredEventReminders: sanitizedDeliveredReminders,
    },
    summary: {
      tasksCount: sanitizedTasks.length,
      pursuitsCount: sanitizedPursuits.length,
      timeRecordsCount: sanitizedTimeRecords.length,
      userName: sanitizedUserName,
    },
  };
}

/**
 * Atomically restores the verified backup data into IndexedDB and localStorage.
 */
export async function restoreBackupData(backupData: NudgeBackupData): Promise<void> {
  // 1. Atomically replace database stores
  await db.replaceWholeDatabase(backupData);

  // 2. Synchronize localStorage
  if (typeof localStorage !== 'undefined') {
    if (backupData.settings) {
      localStorage.setItem('nudge_theme_mode', backupData.settings.themeMode);
      localStorage.setItem('nudge_notifications_enabled', String(backupData.settings.notificationsEnabled));
      localStorage.setItem('nudge_again_enabled', String(backupData.settings.nudgeAgainEnabled));
      localStorage.setItem('nudge_default_snooze', backupData.settings.defaultSnooze);
      if (backupData.settings.eventReminderOption) {
        localStorage.setItem('nudge_event_reminder_option', backupData.settings.eventReminderOption);
      }
      if (backupData.settings.eventReminderCustomDays) {
        localStorage.setItem('nudge_event_reminder_custom_days', String(backupData.settings.eventReminderCustomDays));
      }
    }

    if (backupData.userName) {
      localStorage.setItem('nudge_user_name', backupData.userName);
    }

    if (backupData.deliveredEventReminders) {
      localStorage.setItem(
        'nudge_delivered_event_reminders',
        JSON.stringify(backupData.deliveredEventReminders)
      );
    }
  }

  // 3. Notify all application hooks to reload immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nudge-data-changed'));
  }
}

/**
 * Permanently removes all locally stored Nudge Web data and resets to defaults.
 */
export async function clearAllLocalData(): Promise<void> {
  // 1. Clear IndexedDB stores and reset settings
  await db.clearAllDatabaseStores();

  // 2. Clear only nudge-specific localStorage keys
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nudge_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Reset default user name
    localStorage.setItem('nudge_user_name', 'Bloom');
  }

  // 3. Notify all application components to clear local states
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nudge-data-changed'));
  }
}
