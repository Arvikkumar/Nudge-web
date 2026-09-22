import { useState, useEffect, useRef, useCallback } from 'react';
import { Pursuit, ActiveTimerState } from '../types';
import * as db from '../db/nudgeDb';

const TIMER_STORAGE_KEY = 'nudge_active_timer';

export interface UseHoursTrackerReturn {
  pursuits: Pursuit[];
  isLoading: boolean;
  activeTimer: {
    pursuitId: number;
    isRunning: boolean;
    elapsedSeconds: number;
    pursuitName?: string;
  } | null;
  startTimer: (pursuitId: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  createPursuit: (data: {
    name: string;
    targetHours: number;
    emoji?: string;
    color?: string;
  }) => Promise<Pursuit>;
  editPursuit: (pursuit: Pursuit) => Promise<void>;
  deletePursuit: (id: number) => Promise<void>;
  addManualHours: (pursuitId: number, hours: number) => Promise<void>;
}

export const useHoursTracker = (): UseHoursTrackerReturn => {
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active timer state
  const [timerState, setTimerState] = useState<ActiveTimerState | null>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [currentElapsed, setCurrentElapsed] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Load pursuits from DB
  const loadPursuits = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await db.getAllPursuits();
      setPursuits(items);
    } catch (err) {
      console.error('Failed to load pursuits:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPursuits();
    const handleDataChange = () => {
      loadPursuits();
    };
    window.addEventListener('nudge-data-changed', handleDataChange);
    return () => window.removeEventListener('nudge-data-changed', handleDataChange);
  }, [loadPursuits]);

  // Sync timerState to localStorage
  useEffect(() => {
    if (timerState) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [timerState]);

  // Timer tick effect
  useEffect(() => {
    if (!timerState) {
      setCurrentElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const calculateElapsed = () => {
      if (!timerState.isRunning) {
        return timerState.accumulatedSeconds;
      }
      const now = Date.now();
      const currentRunSeconds = Math.floor((now - timerState.startedAt) / 1000);
      return timerState.accumulatedSeconds + Math.max(0, currentRunSeconds);
    };

    setCurrentElapsed(calculateElapsed());

    if (timerState.isRunning) {
      intervalRef.current = window.setInterval(() => {
        setCurrentElapsed(calculateElapsed());
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  const startTimer = (pursuitId: number) => {
    const newState: ActiveTimerState = {
      pursuitId,
      isRunning: true,
      startedAt: Date.now(),
      accumulatedSeconds: 0,
    };
    setTimerState(newState);
  };

  const pauseTimer = () => {
    if (!timerState || !timerState.isRunning) return;
    const now = Date.now();
    const additional = Math.floor((now - timerState.startedAt) / 1000);
    const updated: ActiveTimerState = {
      ...timerState,
      isRunning: false,
      accumulatedSeconds: timerState.accumulatedSeconds + Math.max(0, additional),
    };
    setTimerState(updated);
  };

  const resumeTimer = () => {
    if (!timerState || timerState.isRunning) return;
    const updated: ActiveTimerState = {
      ...timerState,
      isRunning: true,
      startedAt: Date.now(),
    };
    setTimerState(updated);
  };

  const stopTimer = async () => {
    if (!timerState) return;

    let finalSeconds = timerState.accumulatedSeconds;
    if (timerState.isRunning) {
      const now = Date.now();
      finalSeconds += Math.floor((now - timerState.startedAt) / 1000);
    }

    const pursuitId = timerState.pursuitId;
    setTimerState(null);
    setCurrentElapsed(0);

    // If at least 15 seconds were tracked, log it as at least 1 minute (or actual minutes)
    if (finalSeconds >= 15) {
      const loggedMinutes = Math.max(1, Math.round(finalSeconds / 60));
      const updatedPursuit = await db.logPursuitTime(pursuitId, loggedMinutes);
      if (updatedPursuit) {
        setPursuits((prev) =>
          prev.map((p) => (p.id === pursuitId ? updatedPursuit : p))
        );
      }
    }
  };

  const createPursuit = async (data: {
    name: string;
    targetHours: number;
    emoji?: string;
    color?: string;
  }): Promise<Pursuit> => {
    const color = data.color || 'bg-blue-500';
    const newPursuit = await db.addPursuit({
      name: data.name,
      targetHours: data.targetHours,
      loggedMinutes: 0,
      color,
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
      badgeText: 'text-blue-700 dark:text-blue-300',
      emoji: data.emoji || '🎯',
    });

    setPursuits((prev) => [...prev, newPursuit]);
    return newPursuit;
  };

  const editPursuit = async (pursuit: Pursuit): Promise<void> => {
    await db.updatePursuit(pursuit);
    setPursuits((prev) => prev.map((p) => (p.id === pursuit.id ? pursuit : p)));
  };

  const deletePursuit = async (id: number): Promise<void> => {
    if (timerState?.pursuitId === id) {
      setTimerState(null);
    }
    await db.deletePursuit(id);
    setPursuits((prev) => prev.filter((p) => p.id !== id));
  };

  const addManualHours = async (pursuitId: number, hours: number): Promise<void> => {
    const minutes = Math.round(hours * 60);
    const updated = await db.logPursuitTime(pursuitId, minutes);
    if (updated) {
      setPursuits((prev) =>
        prev.map((p) => (p.id === pursuitId ? updated : p))
      );
    }
  };

  const activePursuit = timerState
    ? pursuits.find((p) => p.id === timerState.pursuitId)
    : undefined;

  return {
    pursuits,
    isLoading,
    activeTimer: timerState
      ? {
          pursuitId: timerState.pursuitId,
          isRunning: timerState.isRunning,
          elapsedSeconds: currentElapsed,
          pursuitName: activePursuit?.name,
        }
      : null,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    createPursuit,
    editPursuit,
    deletePursuit,
    addManualHours,
  };
};
