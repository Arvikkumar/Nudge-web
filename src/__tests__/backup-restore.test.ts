import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBackupFile,
  parseAndValidateBackupJson,
  restoreBackupData,
  clearAllLocalData,
  NudgeBackupFile,
} from '../utils/backupRestore';
import * as db from '../db/nudgeDb';

describe('Data Backup & Restore Tests', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.clearAllDatabaseStores();
  });

  it('generates a valid backup envelope with all persistent stores', async () => {
    // Add a test task and settings
    await db.addTask({
      title: 'Water the plants',
      timeLabel: 'Morning',
      dateLabel: 'Today',
      category: 'Home',
      priority: 'Normal',
      repeat: 'Does not repeat',
      startDate: '2026-09-21',
      completedDates: [],
      isDone: false,
    });

    localStorage.setItem('nudge_user_name', 'TestUser');
    localStorage.setItem('nudge_delivered_event_reminders', JSON.stringify(['2026-09-21-peace_day']));

    const backup = await createBackupFile();

    expect(backup.app).toBe('nudge-web');
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBeDefined();
    expect(Array.isArray(backup.data.tasks)).toBe(true);
    expect(backup.data.tasks.length).toBeGreaterThanOrEqual(1);
    expect(backup.data.tasks[0].title).toBe('Water the plants');
    expect(backup.data.userName).toBe('TestUser');
    expect(backup.data.deliveredEventReminders).toContain('2026-09-21-peace_day');
  });

  describe('Validation', () => {
    it('successfully validates standard Nudge backup JSON', () => {
      const validBackup: NudgeBackupFile = {
        version: 1,
        app: 'nudge-web',
        exportedAt: '2026-09-21T12:00:00.000Z',
        data: {
          tasks: [
            {
              id: 101,
              title: 'Review quarterly reflection',
              timeLabel: '2:00 PM',
              dateLabel: 'Today',
              category: 'Focus',
              priority: 'Important',
              repeat: 'Does not repeat',
              startDate: '2026-09-21',
              completedDates: [],
              isDone: false,
              createdAt: 1774300000000,
              completedAt: null,
              isDeleted: false,
              deletedAt: null,
            },
          ],
          pursuits: [
            {
              id: 1,
              name: 'Reading',
              emoji: '📚',
              targetHours: 20,
              loggedMinutes: 300,
              color: 'bg-emerald-500',
              badgeBg: 'bg-emerald-50',
              badgeText: 'text-emerald-700',
              isArchived: false,
              createdAt: 1774000000000,
            },
          ],
          timeRecords: [
            {
              id: 1,
              pursuitId: 1,
              date: '2026-09-21',
              minutes: 60,
              note: 'Philosophy chapter',
              createdAt: 1774300000000,
            },
          ],
          settings: {
            themeMode: 'dark',
            notificationsEnabled: true,
            nudgeAgainEnabled: false,
            defaultSnooze: '1 hour',
            eventReminderOption: '1_day',
            eventReminderCustomDays: 3,
          },
          userName: 'Elena',
        },
      };

      const result = parseAndValidateBackupJson(JSON.stringify(validBackup));
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.summary?.tasksCount).toBe(1);
      expect(result.summary?.pursuitsCount).toBe(1);
      expect(result.summary?.timeRecordsCount).toBe(1);
      expect(result.summary?.userName).toBe('Elena');
      expect(result.data?.settings.themeMode).toBe('dark');
    });

    it('rejects empty or whitespace-only backup files', () => {
      expect(parseAndValidateBackupJson('').isValid).toBe(false);
      expect(parseAndValidateBackupJson('   ').isValid).toBe(false);
      expect(parseAndValidateBackupJson('   ').error).toContain('empty');
    });

    it('rejects invalid JSON syntax', () => {
      const result = parseAndValidateBackupJson('{ "brokenJson": ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid or unreadable JSON');
    });

    it('rejects backups with mismatched app target', () => {
      const foreignBackup = {
        app: 'some-other-app',
        version: 1,
        data: { tasks: [] },
      };
      const result = parseAndValidateBackupJson(JSON.stringify(foreignBackup));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Expected "nudge-web"');
    });

    it('rejects backups with no recognizable Nudge data', () => {
      const emptyPayload = {
        unrelatedField: 'hello world',
      };
      const result = parseAndValidateBackupJson(JSON.stringify(emptyPayload));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not contain recognizable Nudge Web data');
    });

    it('rejects backups containing corrupted task records', () => {
      const corruptedTasks = {
        app: 'nudge-web',
        version: 1,
        data: {
          tasks: [
            { id: 1 }, // Missing title
          ],
        },
      };
      const result = parseAndValidateBackupJson(JSON.stringify(corruptedTasks));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing a valid title');
    });

    it('handles backwards compatibility for older backups with missing settings', () => {
      const olderBackup = {
        app: 'nudge-web',
        version: 1,
        data: {
          tasks: [{ title: 'Ancient task' }],
          settings: {
            themeMode: 'light',
          },
        },
      };

      const result = parseAndValidateBackupJson(JSON.stringify(olderBackup));
      expect(result.isValid).toBe(true);
      expect(result.data?.settings.themeMode).toBe('light');
      // Defaults filled in
      expect(result.data?.settings.notificationsEnabled).toBe(true);
      expect(result.data?.settings.eventReminderOption).toBe('off');
    });
  });

  describe('Restoration', () => {
    it('atomically restores database and synchronizes localStorage', async () => {
      const testBackupData = {
        tasks: [
          {
            id: 42,
            title: 'Restored Task 42',
            timeLabel: '9:00 AM',
            dateLabel: 'Today',
            category: 'Personal',
            priority: 'Important' as const,
            repeat: 'Does not repeat',
            startDate: '2026-09-21',
            completedDates: [],
            isDone: false,
            createdAt: Date.now(),
            completedAt: null,
            isDeleted: false,
            deletedAt: null,
          },
        ],
        pursuits: [
          {
            id: 5,
            name: 'Violin Practice',
            emoji: '🎻',
            targetHours: 30,
            loggedMinutes: 120,
            color: 'bg-purple-500',
            badgeBg: 'bg-purple-50',
            badgeText: 'text-purple-700',
            isArchived: false,
            createdAt: Date.now(),
          },
        ],
        timeRecords: [
          {
            id: 10,
            pursuitId: 5,
            date: '2026-09-21',
            minutes: 120,
            note: 'Bach Partita 2',
            createdAt: Date.now(),
          },
        ],
        settings: {
          themeMode: 'dark' as const,
          notificationsEnabled: false,
          nudgeAgainEnabled: true,
          defaultSnooze: '15m',
          eventReminderOption: '2_days' as const,
          eventReminderCustomDays: 2,
        },
        userName: 'Aria',
        deliveredEventReminders: ['2026-10-01-world_habit'],
      };

      await restoreBackupData(testBackupData);

      // Verify DB
      const tasksInDb = await db.getAllTasks();
      expect(tasksInDb.length).toBe(1);
      expect(tasksInDb[0].title).toBe('Restored Task 42');

      const pursuitsInDb = await db.getAllPursuits();
      expect(pursuitsInDb.some((p) => p.name === 'Violin Practice')).toBe(true);

      const settingsInDb = await db.getSettings();
      expect(settingsInDb.themeMode).toBe('dark');
      expect(settingsInDb.notificationsEnabled).toBe(false);
      expect(settingsInDb.eventReminderOption).toBe('2_days');

      // Verify localStorage
      expect(localStorage.getItem('nudge_theme_mode')).toBe('dark');
      expect(localStorage.getItem('nudge_user_name')).toBe('Aria');
      expect(localStorage.getItem('nudge_event_reminder_option')).toBe('2_days');
    });
  });

  describe('Clear All Data', () => {
    it('clears database stores and removes only nudge_* localStorage keys', async () => {
      // Seed some data
      await db.addTask({
        title: 'Task before wipe',
        timeLabel: 'Morning',
        dateLabel: 'Today',
        category: 'Personal',
        priority: 'Normal',
        repeat: 'Does not repeat',
        startDate: '2026-09-21',
        completedDates: [],
        isDone: false,
      });

      localStorage.setItem('nudge_user_name', 'TemporaryName');
      localStorage.setItem('nudge_theme_mode', 'dark');
      localStorage.setItem('nudge_delivered_event_reminders', '["item"]');
      // Unrelated key from another system/app
      localStorage.setItem('unrelated_user_key', 'should_remain_intact');

      await clearAllLocalData();

      // Check tasks
      const tasks = await db.getAllTasks();
      expect(tasks.length).toBe(0);

      // Check settings reset
      const settings = await db.getSettings();
      expect(settings.themeMode).toBe('system');

      // Check localStorage keys
      expect(localStorage.getItem('nudge_theme_mode')).toBeNull();
      expect(localStorage.getItem('nudge_user_name')).toBe('Bloom'); // Reset to default
      expect(localStorage.getItem('unrelated_user_key')).toBe('should_remain_intact'); // Untouched!
    });
  });
});
