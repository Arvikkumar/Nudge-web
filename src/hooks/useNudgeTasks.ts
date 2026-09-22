import { useState, useEffect, useCallback } from 'react';
import { NudgeTask, TaskPriority } from '../types';
import * as db from '../db/nudgeDb';
import { getTodayIso, isRepeatingTask } from '../utils/recurrence';
import { calculateSnooze } from '../utils/nlpParser';

export interface CreateTaskInput {
  title: string;
  timeLabel?: string;
  dateLabel?: string;
  category?: string;
  priority?: TaskPriority;
  repeat?: string;
  startDate?: string;
  completedDates?: string[];
  isDone?: boolean;
}

export const useNudgeTasks = () => {
  const [tasks, setTasks] = useState<NudgeTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await db.getAllTasks();
      setTasks(items);
    } catch (err) {
      console.error('Failed to load tasks from IndexedDB:', err);
      setError('Could not access offline task database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const handleDataChange = () => {
      loadTasks();
    };
    window.addEventListener('nudge-data-changed', handleDataChange);
    return () => window.removeEventListener('nudge-data-changed', handleDataChange);
  }, [loadTasks]);

  const createTask = async (input: CreateTaskInput): Promise<NudgeTask> => {
    const todayIso = getTodayIso();
    const created = await db.addTask({
      title: input.title.trim(),
      timeLabel: input.timeLabel || 'Any time',
      dateLabel: input.dateLabel || 'Today',
      category: input.category || 'Personal',
      priority: input.priority || 'Normal',
      repeat: input.repeat || 'Does not repeat',
      startDate: input.startDate || todayIso,
      completedDates: input.completedDates || [],
      isDone: input.isDone ?? false,
    });
    setTasks((prev) => [created, ...prev]);
    return created;
  };

  const editTask = async (id: number, updates: Partial<NudgeTask>): Promise<void> => {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;

    const updated: NudgeTask = {
      ...existing,
      ...updates,
      completedAt:
        updates.isDone !== undefined
          ? updates.isDone
            ? Date.now()
            : null
          : existing.completedAt,
    };

    await db.updateTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  /**
   * Toggles task completion.
   * If the task is recurring, it toggles completion for the specific occurrence date (targetDateIso).
   * If non-recurring, it toggles the task's single isDone property.
   */
  const toggleTaskDone = async (id: number, targetDateIso?: string): Promise<void> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const dateToToggle = targetDateIso || getTodayIso();

    if (isRepeatingTask(target)) {
      const currentCompletedDates = target.completedDates || [];
      const isAlreadyCompleted = currentCompletedDates.includes(dateToToggle);

      const nextCompletedDates = isAlreadyCompleted
        ? currentCompletedDates.filter((d) => d !== dateToToggle)
        : [...currentCompletedDates, dateToToggle];

      const updated: NudgeTask = {
        ...target,
        completedDates: nextCompletedDates,
        // Crucial requirement: completing today's occurrence must NOT permanently complete
        // the recurring task or remove future occurrences
        isDone: false,
      };

      await db.updateTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } else {
      // One-time task
      const nextDone = !target.isDone;
      const updated: NudgeTask = {
        ...target,
        isDone: nextDone,
        completedAt: nextDone ? Date.now() : null,
      };

      await db.updateTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const snoozeTask = async (
    id: number,
    snoozeType: '30m' | 'tonight' | 'tomorrow'
  ): Promise<void> => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const { timeLabel, dateLabel, startDateIso } = calculateSnooze(snoozeType);

    const updated: NudgeTask = {
      ...target,
      timeLabel,
      dateLabel,
      startDate: startDateIso,
      isDone: false,
      completedAt: null,
    };

    await db.updateTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const removeTask = async (id: number): Promise<void> => {
    await db.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const restoreTask = async (id: number): Promise<void> => {
    await db.restoreTask(id);
    await loadTasks();
  };

  const getDeletedTasks = async (): Promise<NudgeTask[]> => {
    return await db.getDeletedTasks();
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    editTask,
    toggleTaskDone,
    snoozeTask,
    removeTask,
    restoreTask,
    getDeletedTasks,
    refreshTasks: loadTasks,
  };
};
