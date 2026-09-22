import { useState, useEffect, useCallback, useRef } from 'react';
import { NudgeTask } from '../types';
import {
  findDueReminders,
  markReminderDelivered,
  sendBrowserTaskNotification,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/reminderScheduler';

interface UseTaskRemindersProps {
  tasks: NudgeTask[];
  notificationsEnabled: boolean;
  onToggleDone: (taskId: number) => Promise<void>;
  onSnoozeTask: (taskId: number, snoozeType: '30m' | 'tonight' | 'tomorrow') => Promise<void>;
}

export function useTaskReminders({
  tasks,
  notificationsEnabled,
  onToggleDone,
  onSnoozeTask,
}: UseTaskRemindersProps) {
  const [activeNotificationTask, setActiveNotificationTask] = useState<NudgeTask | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    () => getNotificationPermission()
  );

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const notificationsEnabledRef = useRef(notificationsEnabled);
  notificationsEnabledRef.current = notificationsEnabled;

  // Register service worker if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Listen for service worker notification click messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICK_ACTION') {
              const { action, tag } = event.data;
              if (tag?.startsWith('nudge_task_')) {
                const taskId = parseInt(tag.replace('nudge_task_', ''), 10);
                if (taskId) {
                  if (action === 'done') {
                    onToggleDone(taskId);
                  } else if (action === 'snooze') {
                    onSnoozeTask(taskId, '30m');
                  }
                }
              }
            }
          });
        })
        .catch(() => {
          // Service worker optional, fallback to window notifications
        });
    }
  }, [onToggleDone, onSnoozeTask]);

  // Check for due reminders
  const checkForDueReminders = useCallback(() => {
    if (!notificationsEnabledRef.current) return;

    const dueReminders = findDueReminders(tasksRef.current);
    if (dueReminders.length === 0) return;

    // Process the first due reminder
    const firstDue = dueReminders[0];
    markReminderDelivered(firstDue.occurrenceKey);

    // Show browser notification
    sendBrowserTaskNotification(firstDue.task, firstDue.triggerMillis);

    // Show in-app banner toast
    setActiveNotificationTask(firstDue.task);
  }, []);

  // Periodic scheduler interval & visibility change listener
  useEffect(() => {
    // Immediate check
    checkForDueReminders();

    // Check every 12 seconds
    const interval = setInterval(() => {
      checkForDueReminders();
    }, 12000);

    // Check when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setPermissionStatus(getNotificationPermission());
        checkForDueReminders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForDueReminders]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    return res;
  };

  const handleCompleteActive = async () => {
    if (!activeNotificationTask) return;
    const id = activeNotificationTask.id;
    setActiveNotificationTask(null);
    await onToggleDone(id);
  };

  const handleSnoozeActive = async (snoozeType: '30m' | 'tonight' | 'tomorrow' = '30m') => {
    if (!activeNotificationTask) return;
    const id = activeNotificationTask.id;
    setActiveNotificationTask(null);
    await onSnoozeTask(id, snoozeType);
  };

  const handleDismissActive = () => {
    setActiveNotificationTask(null);
  };

  return {
    activeNotificationTask,
    permissionStatus,
    requestPermission: handleRequestPermission,
    completeActiveTask: handleCompleteActive,
    snoozeActiveTask: handleSnoozeActive,
    dismissActiveToast: handleDismissActive,
  };
}
