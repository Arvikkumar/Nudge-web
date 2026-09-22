import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TodayPage } from './pages/TodayPage';
import { NotesPage } from './pages/NotesPage';
import { HoursPage } from './pages/HoursPage';
import { SettingsPage } from './pages/SettingsPage';
import { TaskModal } from './components/tasks/TaskModal';
import { RecentlyDeletedModal } from './components/tasks/RecentlyDeletedModal';
import { useNudgeTasks } from './hooks/useNudgeTasks';
import { useNudgeSettings } from './hooks/useNudgeSettings';
import { useDeepDive } from './hooks/useDeepDive';
import { useTaskReminders } from './hooks/useTaskReminders';
import { useEventReminders } from './hooks/useEventReminders';
import { DeepDiveConfigModal } from './components/deepdive/DeepDiveConfigModal';
import { DeepDiveActiveModal } from './components/deepdive/DeepDiveActiveModal';
import { DeepDiveCompletionModal } from './components/deepdive/DeepDiveCompletionModal';
import { DeepDiveGlobalIndicator } from './components/deepdive/DeepDiveGlobalIndicator';
import { NotificationToast } from './components/notifications/NotificationToast';
import { EventReminderToast } from './components/notifications/EventReminderToast';
import { NavView, ThemeMode, NudgeTask, TaskPriority } from './types';

export const App: React.FC = () => {
  // Navigation state
  const [activeView, setActiveView] = useState<NavView>(() => {
    const hash = window.location.hash.replace('#', '') as NavView;
    if (['today', 'notes', 'hours', 'settings'].includes(hash)) {
      return hash;
    }
    return 'today';
  });

  // User Profile Name State
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('nudge_user_name') || 'Bloom';
  });

  // Settings & Theme Hook (Synchronized with IndexedDB and localStorage)
  const { settings, updateSettings } = useNudgeSettings();

  // IndexedDB Persistent Tasks Hook
  const {
    tasks,
    isLoading,
    createTask,
    editTask,
    toggleTaskDone,
    snoozeTask,
    removeTask,
    restoreTask,
    getDeletedTasks,
  } = useNudgeTasks();

  // Undo Toast & Trash Recovery State
  const [deletedToast, setDeletedToast] = useState<{ id: number; title: string } | null>(null);
  const deletedTimerRef = useRef<number | null>(null);
  const [deletedTasksList, setDeletedTasksList] = useState<NudgeTask[]>([]);
  const [isRecentlyDeletedOpen, setIsRecentlyDeletedOpen] = useState(false);

  const refreshDeletedTasks = useCallback(async () => {
    try {
      const items = await getDeletedTasks();
      setDeletedTasksList(items);
    } catch {
      setDeletedTasksList([]);
    }
  }, [getDeletedTasks]);

  useEffect(() => {
    refreshDeletedTasks();
  }, [tasks, refreshDeletedTasks]);

  const handleDeleteTaskWithUndo = async (id: number) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    await removeTask(id);
    if (taskToDelete) {
      if (deletedTimerRef.current) clearTimeout(deletedTimerRef.current);
      setDeletedToast({ id, title: taskToDelete.title });
      deletedTimerRef.current = window.setTimeout(() => {
        setDeletedToast(null);
      }, 5000);
    }
    refreshDeletedTasks();
  };

  const handleRestoreTask = async (id: number) => {
    await restoreTask(id);
    if (deletedToast && deletedToast.id === id) {
      setDeletedToast(null);
    }
    refreshDeletedTasks();
  };

  // Deep Dive Focus Hook
  const {
    state: deepDiveState,
    startSession: startDeepDive,
    endSession: endDeepDive,
    dismissCompletion: dismissDeepDiveCompletion,
    isConfigModalOpen: isDeepDiveConfigOpen,
    setIsConfigModalOpen: setIsDeepDiveConfigOpen,
    isActiveModalOpen: isDeepDiveActiveOpen,
    setIsActiveModalOpen: setIsDeepDiveActiveOpen,
    isCompletionModalOpen: isDeepDiveCompletionOpen,
    setIsCompletionModalOpen: setIsDeepDiveCompletionOpen,
  } = useDeepDive();

  // Task Reminders & Notifications Hook
  const {
    activeNotificationTask,
    completeActiveTask,
    snoozeActiveTask,
    dismissActiveToast,
  } = useTaskReminders({
    tasks,
    notificationsEnabled: settings.notificationsEnabled,
    onToggleDone: toggleTaskDone,
    onSnoozeTask: snoozeTask,
  });

  // Global Event / Important Observance Reminders Hook
  const {
    activeEventReminder,
    dismissActiveReminder,
  } = useEventReminders({
    settings,
  });

  // Task Composer / Edit Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<NudgeTask | null>(null);

  // Keep hash in sync for clean browser navigation & bookmarking
  const handleNavigate = (view: NavView) => {
    setActiveView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavView;
      if (['today', 'notes', 'hours', 'settings'].includes(hash)) {
        setActiveView(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onDataChange = () => {
      const storedName = localStorage.getItem('nudge_user_name') || 'Bloom';
      setUserName(storedName);
    };
    window.addEventListener('nudge-data-changed', onDataChange);
    return () => window.removeEventListener('nudge-data-changed', onDataChange);
  }, []);

  const handleUpdateUserName = (newName: string) => {
    setUserName(newName);
    localStorage.setItem('nudge_user_name', newName);
  };

  const handleToggleTheme = () => {
    const nextMode: ThemeMode = settings.themeMode === 'dark' ? 'light' : 'dark';
    updateSettings({ themeMode: nextMode });
  };

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: NudgeTask) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveModal = async (data: {
    title: string;
    timeLabel: string;
    dateLabel: string;
    startDate?: string;
    category: string;
    priority: TaskPriority;
    repeat: string;
  }) => {
    if (taskToEdit) {
      await editTask(taskToEdit.id, data);
    } else {
      await createTask(data);
    }
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={handleNavigate}
      userName={userName}
      onUpdateName={handleUpdateUserName}
      themeMode={settings.themeMode}
      onToggleTheme={handleToggleTheme}
      onOpenQuickAdd={handleOpenCreateModal}
    >
      {activeView === 'today' && (
        <TodayPage
          tasks={tasks}
          onToggleDone={toggleTaskDone}
          onCreateTask={createTask}
          onEditTask={handleOpenEditModal}
          onDeleteTask={handleDeleteTaskWithUndo}
          onSnoozeTask={snoozeTask}
          deepDiveState={deepDiveState}
          onOpenDeepDiveConfig={() => setIsDeepDiveConfigOpen(true)}
          onOpenDeepDiveActive={() => setIsDeepDiveActiveOpen(true)}
        />
      )}
      {activeView === 'notes' && (
        <NotesPage
          tasks={tasks}
          onToggleDone={toggleTaskDone}
          onCreateTask={createTask}
          onEditTask={handleOpenEditModal}
          onDeleteTask={handleDeleteTaskWithUndo}
          onSnoozeTask={snoozeTask}
          onOpenComposer={handleOpenCreateModal}
        />
      )}
      {activeView === 'hours' && <HoursPage />}
      {activeView === 'settings' && (
        <SettingsPage
          settings={settings}
          onUpdateSettings={updateSettings}
          deletedTasksCount={deletedTasksList.length}
          onOpenRecentlyDeleted={() => setIsRecentlyDeletedOpen(true)}
        />
      )}

      {/* Global In-App Task Reminder Notification Toast */}
      {activeNotificationTask && (
        <NotificationToast
          task={activeNotificationTask}
          onComplete={completeActiveTask}
          onSnooze={snoozeActiveTask}
          onDismiss={dismissActiveToast}
        />
      )}

      {/* Global In-App Important Observance / Event Reminder Toast */}
      {activeEventReminder && (
        <EventReminderToast
          reminder={activeEventReminder}
          onDismiss={dismissActiveReminder}
          onViewDate={() => {
            dismissActiveReminder();
            handleNavigate('today');
          }}
        />
      )}

      {/* Global Active Deep Dive Mini-Bar / Floating Indicator */}
      {activeView !== 'today' && (
        <DeepDiveGlobalIndicator
          state={deepDiveState}
          onOpenActive={() => setIsDeepDiveActiveOpen(true)}
        />
      )}

      {/* Deep Dive Configuration Modal */}
      <DeepDiveConfigModal
        isOpen={isDeepDiveConfigOpen}
        onClose={() => setIsDeepDiveConfigOpen(false)}
        onStartSession={startDeepDive}
      />

      {/* Deep Dive Active Detail Modal */}
      <DeepDiveActiveModal
        isOpen={isDeepDiveActiveOpen}
        state={deepDiveState}
        onClose={() => setIsDeepDiveActiveOpen(false)}
        onEndSession={endDeepDive}
      />

      {/* Deep Dive Normal Completion Modal */}
      <DeepDiveCompletionModal
        isOpen={isDeepDiveCompletionOpen}
        durationMinutes={deepDiveState.durationMinutes}
        onDismiss={dismissDeepDiveCompletion}
      />

      {/* Persistent Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        initialDateLabel={activeView === 'today' ? 'Today' : 'Tomorrow'}
        onSave={handleSaveModal}
        onDelete={handleDeleteTaskWithUndo}
      />

      {/* Trash / Recently Deleted Modal */}
      <RecentlyDeletedModal
        isOpen={isRecentlyDeletedOpen}
        onClose={() => setIsRecentlyDeletedOpen(false)}
        deletedTasks={deletedTasksList}
        onRestoreTask={handleRestoreTask}
      />

      {/* Undo Task Deletion Floating Toast */}
      {deletedToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/90 dark:bg-zinc-100/95 text-white dark:text-zinc-900 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300">
          <span className="text-xs font-medium truncate max-w-[200px] sm:max-w-xs">
            "{deletedToast.title}" removed
          </span>
          <button
            type="button"
            onClick={() => handleRestoreTask(deletedToast.id)}
            className="text-xs font-bold text-nudge-blue dark:text-blue-600 hover:underline uppercase tracking-wide shrink-0 ml-1"
          >
            Undo
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default App;
