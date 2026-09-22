import { useState, useEffect, useCallback } from 'react';
import {
  DeepDiveState,
  getDeepDiveState,
  saveDeepDiveState,
  startDeepDiveSession,
  endDeepDiveSession,
  markDeepDiveCompleted,
  dismissDeepDiveCompletion,
  DeepDiveReminderPoint,
} from '../utils/deepDive';
import { playGentleChime } from '../utils/audioChime';

export function useDeepDive() {
  const [state, setState] = useState<DeepDiveState>(() => getDeepDiveState());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Sync state with storage / cross-tab updates
  const syncState = useCallback(() => {
    const current = getDeepDiveState();
    setState(current);
    if (!current.isActive && current.completedAtMillis && !current.isCompletedDismissed) {
      setIsCompletionModalOpen(true);
    }
  }, []);

  useEffect(() => {
    syncState();

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<DeepDiveState>;
      if (customEvent.detail) {
        setState(customEvent.detail);
        if (
          !customEvent.detail.isActive &&
          customEvent.detail.completedAtMillis &&
          !customEvent.detail.isCompletedDismissed
        ) {
          setIsCompletionModalOpen(true);
        }
      } else {
        syncState();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nudge_deep_dive_state') {
        syncState();
      }
    };

    window.addEventListener('nudge_deep_dive_change', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('nudge_deep_dive_change', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncState]);

  // Main active session ticker
  useEffect(() => {
    if (!state.isActive || state.endTimeMillis <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Check for completion
      if (now >= state.endTimeMillis) {
        const completed = markDeepDiveCompleted();
        setState(completed);
        setIsActiveModalOpen(false);
        setIsCompletionModalOpen(true);
        return;
      }

      // Check intermediate reminders
      if (state.reminderPoints && state.reminderPoints.length > 0) {
        let reminderTriggered = false;
        const updatedReminders = state.reminderPoints.map((rem) => {
          if (!rem.notified && now >= rem.triggerTimeMillis) {
            reminderTriggered = true;
            playGentleChime('reminder');
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification('Deep Dive Checkpoint', {
                  body: `${rem.label} · Focus session continuing.`,
                  tag: `deep_dive_rem_${rem.id}`,
                  silent: true,
                });
              } catch {
                // Ignored
              }
            }
            return { ...rem, notified: true };
          }
          return rem;
        });

        if (reminderTriggered) {
          const nextState: DeepDiveState = {
            ...state,
            reminderPoints: updatedReminders,
          };
          saveDeepDiveState(nextState);
          setState(nextState);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  const handleStart = (
    endTimeMillis: number,
    durationMinutes: number,
    style: 'One Shot' | 'Full Ringtone',
    reminders: DeepDiveReminderPoint[]
  ) => {
    const started = startDeepDiveSession(endTimeMillis, durationMinutes, style, reminders);
    setState(started);
  };

  const handleEnd = () => {
    const ended = endDeepDiveSession();
    setState(ended);
    setIsActiveModalOpen(false);
  };

  const handleDismissCompletion = () => {
    const dismissed = dismissDeepDiveCompletion();
    setState(dismissed);
    setIsCompletionModalOpen(false);
  };

  return {
    state,
    startSession: handleStart,
    endSession: handleEnd,
    dismissCompletion: handleDismissCompletion,
    isConfigModalOpen,
    setIsConfigModalOpen,
    isActiveModalOpen,
    setIsActiveModalOpen,
    isCompletionModalOpen,
    setIsCompletionModalOpen,
  };
}
