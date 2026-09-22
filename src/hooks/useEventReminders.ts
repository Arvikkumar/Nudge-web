import { useState, useEffect, useCallback, useRef } from 'react';
import { NudgeSettings } from '../types';
import {
  DueEventReminder,
  findDueEventReminders,
  markEventReminderDelivered,
  sendBrowserEventNotification,
} from '../utils/eventReminderScheduler';

interface UseEventRemindersProps {
  settings: NudgeSettings;
}

export function useEventReminders({ settings }: UseEventRemindersProps) {
  const [activeEventReminder, setActiveEventReminder] = useState<DueEventReminder | null>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const checkDueEventReminders = useCallback(() => {
    const currentSettings = settingsRef.current;
    if (!currentSettings.eventReminderOption || currentSettings.eventReminderOption === 'off') {
      return;
    }

    const dueList = findDueEventReminders(currentSettings);
    if (dueList.length === 0) {
      return;
    }

    // Deliver the first due event reminder
    const firstDue = dueList[0];
    markEventReminderDelivered(firstDue.occurrenceKey);

    // Dispatch native browser notification and peaceful chime if notifications enabled
    if (currentSettings.notificationsEnabled) {
      sendBrowserEventNotification(firstDue);
    }

    // Always show the in-app fallback banner/toast
    setActiveEventReminder(firstDue);
  }, []);

  // Check on mount, whenever settings change, when returning to the tab, and on an interval
  useEffect(() => {
    // Run immediate check
    checkDueEventReminders();

    // Periodic check every 20 seconds
    const interval = setInterval(() => {
      checkDueEventReminders();
    }, 20000);

    // Check when user switches back to this tab
    const handleVisibility = () => {
      if (!document.hidden) {
        checkDueEventReminders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    settings.eventReminderOption,
    settings.eventReminderCustomDays,
    settings.notificationsEnabled,
    checkDueEventReminders,
  ]);

  const dismissActiveReminder = () => {
    setActiveEventReminder(null);
  };

  return {
    activeEventReminder,
    dismissActiveReminder,
    checkDueEventReminders,
  };
}
