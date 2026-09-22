import { useState, useEffect, useCallback } from 'react';
import { NudgeSettings, ThemeMode, EventReminderOption } from '../types';
import * as db from '../db/nudgeDb';

const DEFAULT_SETTINGS: NudgeSettings = {
  themeMode: 'system',
  notificationsEnabled: true,
  nudgeAgainEnabled: true,
  defaultSnooze: '30m',
  eventReminderOption: 'off',
  eventReminderCustomDays: 3,
};

export const useNudgeSettings = () => {
  const [settings, setSettings] = useState<NudgeSettings>(() => {
    // Initial sync load from localStorage for zero flash
    const savedTheme = (localStorage.getItem('nudge_theme_mode') as ThemeMode) || DEFAULT_SETTINGS.themeMode;
    const savedNotif = localStorage.getItem('nudge_notifications_enabled');
    const savedNudgeAgain = localStorage.getItem('nudge_again_enabled');
    const savedSnooze = localStorage.getItem('nudge_default_snooze') || DEFAULT_SETTINGS.defaultSnooze;
    const savedEventOpt = (localStorage.getItem('nudge_event_reminder_option') as EventReminderOption) || DEFAULT_SETTINGS.eventReminderOption;
    const savedCustomDays = parseInt(localStorage.getItem('nudge_event_reminder_custom_days') || '3', 10);

    return {
      themeMode: savedTheme,
      notificationsEnabled: savedNotif !== null ? savedNotif === 'true' : DEFAULT_SETTINGS.notificationsEnabled,
      nudgeAgainEnabled: savedNudgeAgain !== null ? savedNudgeAgain === 'true' : DEFAULT_SETTINGS.nudgeAgainEnabled,
      defaultSnooze: savedSnooze,
      eventReminderOption: savedEventOpt,
      eventReminderCustomDays: isNaN(savedCustomDays) ? 3 : savedCustomDays,
    };
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load from IndexedDB on startup to ensure full state sync
  const fetchSettings = useCallback(async () => {
    try {
      const stored = await db.getSettings();
      setSettings(stored);
    } catch (err) {
      console.error('Failed to load settings from DB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const handleDataChange = () => {
      fetchSettings();
    };
    window.addEventListener('nudge-data-changed', handleDataChange);
    return () => window.removeEventListener('nudge-data-changed', handleDataChange);
  }, [fetchSettings]);

  // Immediate theme DOM update
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (settings.themeMode === 'dark') {
        root.classList.add('dark');
      } else if (settings.themeMode === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (settings.themeMode === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.themeMode]);

  const updateSettings = useCallback(
    async (partial: Partial<NudgeSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...partial };
        // Save to IndexedDB and localStorage
        db.saveSettings(updated);
        return updated;
      });
    },
    []
  );

  return {
    settings,
    isLoading,
    updateSettings,
    refreshSettings: fetchSettings,
  };
};
