import React, { useState, useRef } from 'react';
import {
  Bell,
  Clock,
  Sliders,
  Sparkles,
  Download,
  Upload,
  Trash2,
  FileDown,
  ShieldCheck,
  RotateCcw,
  Volume2,
  Sun,
} from 'lucide-react';
import { NudgeSettings, EventReminderOption, ThemeMode } from '../types';
import { getNotificationPermission, requestNotificationPermission } from '../utils/reminderScheduler';
import { playGentleChime } from '../utils/audioChime';
import {
  createBackupFile,
  downloadBackupFile,
  parseAndValidateBackupJson,
  restoreBackupData,
  clearAllLocalData,
  BackupValidationResult,
} from '../utils/backupRestore';
import {
  ImportConfirmModal,
  ClearConfirmModal,
  ImportErrorModal,
} from '../components/settings/DataManagementModals';

interface SettingsPageProps {
  settings: NudgeSettings;
  onUpdateSettings: (newSettings: Partial<NudgeSettings>) => Promise<void>;
  deletedTasksCount?: number;
  onOpenRecentlyDeleted?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  deletedTasksCount = 0,
  onOpenRecentlyDeleted,
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    () => getNotificationPermission()
  );

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      showFeedback('Browser notification permission granted');
      onUpdateSettings({ notificationsEnabled: true });
    } else if (res === 'denied') {
      showFeedback('Notifications blocked in browser settings');
    }
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    onUpdateSettings({ themeMode: mode });
    showFeedback(`Switched to ${mode} theme`);
  };

  const handleToggleNotifications = () => {
    const nextVal = !settings.notificationsEnabled;
    onUpdateSettings({ notificationsEnabled: nextVal });
    showFeedback(nextVal ? 'Gentle notifications enabled' : 'Notifications muted');
  };

  const handleToggleNudgeAgain = () => {
    const nextVal = !settings.nudgeAgainEnabled;
    onUpdateSettings({ nudgeAgainEnabled: nextVal });
    showFeedback(nextVal ? 'Nudge again active' : 'Nudge again turned off');
  };

  const handleCycleSnooze = () => {
    const order = ['15 minutes', '30 minutes', '1 hour', 'Tomorrow'];
    const current = settings.defaultSnooze || '15 minutes';
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    const nextVal = order[nextIdx];
    onUpdateSettings({ defaultSnooze: nextVal });
    showFeedback(`Default snooze set to ${nextVal}`);
  };

  const handleSelectEventReminderOption = (opt: EventReminderOption) => {
    onUpdateSettings({ eventReminderOption: opt });
    const labelMap: Record<EventReminderOption, string> = {
      off: 'Event reminders turned off',
      '1_day': 'Event reminders set to 1 day before',
      '2_days': 'Event reminders set to 2 days before',
      custom: `Event reminders set to ${settings.eventReminderCustomDays || 3} days before`,
    };
    showFeedback(labelMap[opt]);
  };

  const handleTestChime = () => {
    playGentleChime('gentle');
    showFeedback('Playing gentle chime');
  };

  // Data Management states & handlers
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importValidation, setImportValidation] = useState<BackupValidationResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const backup = await createBackupFile();
      const filename = downloadBackupFile(backup);
      showFeedback(`Backup downloaded: ${filename}`);
    } catch (err) {
      console.error('Failed to export data:', err);
      showFeedback('Failed to generate data backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseAndValidateBackupJson(text);

        if (result.isValid) {
          setImportValidation(result);
          setIsImportModalOpen(true);
        } else {
          setImportErrorMessage(result.error || 'Invalid backup format.');
        }
      } catch (err) {
        setImportErrorMessage('Failed to read backup file.');
      }
    };

    reader.onerror = () => {
      setImportErrorMessage('Unable to load file from disk.');
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importValidation || !importValidation.data) return;

    try {
      await restoreBackupData(importValidation.data);
      setIsImportModalOpen(false);
      setImportValidation(null);
      showFeedback('Backup successfully restored.');
      window.dispatchEvent(new Event('nudge-data-changed'));
    } catch (err) {
      console.error('Failed to restore backup:', err);
      showFeedback('Failed to restore data.');
    }
  };

  const handleConfirmClear = async () => {
    try {
      await clearAllLocalData();
      setIsClearModalOpen(false);
      showFeedback('All local data cleared. Reset complete.');
      window.dispatchEvent(new Event('nudge-data-changed'));
    } catch (err) {
      console.error('Failed to clear data:', err);
      showFeedback('Failed to reset local data.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" data-testid="settings_screen">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-nudge-blue text-white text-xs sm:text-sm font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-3">
          {feedbackMessage}
        </div>
      )}

      {/* Page Heading */}
      <div className="pt-1 pb-1">
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
          Settings that
        </h1>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
          fit your rhythm.
        </h1>
        <p className="text-sm text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-1">
          Customize your gentle rhythm, alerts, and mindful space.
        </p>
      </div>

      {/* 1. Appearance & Theme */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
          Appearance
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Theme
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Light, dark, or sync with your system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-2xl bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 border border-nudge-border/60 dark:border-nudge-border-dark/60">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleSetThemeMode(mode)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                  settings.themeMode === mode
                    ? 'bg-white dark:bg-nudge-card-dark text-nudge-blue dark:text-nudge-blue shadow-xs'
                    : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Alerts & Reminders */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
          Alerts & Reminders
        </h2>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-nudge-blue/10 text-nudge-blue flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Notifications
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                A little tap when something matters
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.notificationsEnabled}
            onClick={handleToggleNotifications}
            data-testid="toggle_notifications"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.notificationsEnabled ? 'bg-nudge-blue' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />

        {/* Default Snooze */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-nudge-parchment text-nudge-text-secondary dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Default snooze
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                A little breathing room
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCycleSnooze}
            data-testid="action_default_snooze"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment transition-all cursor-pointer"
          >
            {settings.defaultSnooze || '15 minutes'} ⌵
          </button>
        </div>

        <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />

        {/* Nudge Again */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-nudge-parchment text-nudge-text-secondary dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Nudge again
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Ask again, softly, if I miss it
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.nudgeAgainEnabled}
            onClick={handleToggleNudgeAgain}
            data-testid="toggle_nudge_again"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.nudgeAgainEnabled ? 'bg-nudge-blue' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                settings.nudgeAgainEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />

        {/* Gentle Chime Sound Setting */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Gentle chime
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Soothing bell tone played on reminder alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestChime}
            data-testid="action_test_chime"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 text-nudge-blue" />
            Test Chime
          </button>
        </div>

        {/* Browser Permission Row */}
        {browserPermission !== 'granted' && (
          <>
            <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                    Browser notifications
                  </p>
                  <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                    {browserPermission === 'denied'
                      ? 'Notifications blocked in browser preferences'
                      : 'Enable browser alerts for background reminders'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={browserPermission === 'denied'}
                data-testid="action_browser_permission"
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  browserPermission === 'denied'
                    ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-500 border-zinc-200'
                    : 'bg-nudge-blue text-white border-nudge-blue shadow-xs hover:bg-blue-600 cursor-pointer'
                }`}
              >
                {browserPermission === 'denied' ? 'Blocked' : 'Enable'}
              </button>
            </div>
          </>
        )}
      </section>

      {/* 3. Celebrations & Observances */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
              Celebrations & Observances
            </h2>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Gentle advance reminders for important calendar observances
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(['off', '1_day', '2_days', 'custom'] as EventReminderOption[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectEventReminderOption(opt)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                settings.eventReminderOption === opt
                  ? 'bg-nudge-blue text-white border-nudge-blue shadow-xs'
                  : 'bg-white dark:bg-nudge-card-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border-nudge-border dark:border-nudge-border-dark hover:border-nudge-blue'
              }`}
            >
              {opt === 'off' && 'Off'}
              {opt === '1_day' && '1 Day Before'}
              {opt === '2_days' && '2 Days Before'}
              {opt === 'custom' && `${settings.eventReminderCustomDays || 3} Days`}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Data Management & Backup */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
          Data & Storage
        </h2>

        {/* Create Backup */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Create local backup
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Save your thoughts, always yours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            data-testid="action_create_backup"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment transition-all cursor-pointer"
          >
            {isExporting ? 'Exporting…' : 'Create Backup'}
          </button>
        </div>

        <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />

        {/* Restore Backup */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Restore backup
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Bring back a saved backup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerImport}
            data-testid="action_restore_backup"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment transition-all cursor-pointer"
          >
            Restore
          </button>
        </div>

        <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />

        {/* Clear Data */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Clear all data
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Start fresh with a clean slate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            data-testid="action_clear_data"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </section>

      {/* 5. History & Archive */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
          History
        </h2>

        {/* Recently Deleted */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Recently deleted
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Recover deleted reminders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenRecentlyDeleted) onOpenRecentlyDeleted();
            }}
            data-testid="action_recently_deleted"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment transition-all cursor-pointer"
          >
            {deletedTasksCount} items ›
          </button>
        </div>

        <div className="h-[1px] bg-nudge-border/40 dark:bg-nudge-border-dark/40" />

        {/* Export PDF */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Export history report
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Comprehensive summary of your gentle nudges
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = 'hours';
            }}
            data-testid="action_export_pdf"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment transition-all cursor-pointer"
          >
            Export PDF ›
          </button>
        </div>
      </section>

      {/* Hidden File Input for Backup Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelected}
        className="hidden"
        data-testid="backup_file_input"
      />

      {/* Confirmation & Error Modals */}
      {isImportModalOpen && importValidation && (
        <ImportConfirmModal
          isOpen={isImportModalOpen}
          filename={selectedFileName}
          validationResult={importValidation}
          onConfirm={handleConfirmImport}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportValidation(null);
          }}
        />
      )}

      {isClearModalOpen && (
        <ClearConfirmModal
          isOpen={isClearModalOpen}
          onConfirm={handleConfirmClear}
          onClose={() => setIsClearModalOpen(false)}
        />
      )}

      {importErrorMessage && (
        <ImportErrorModal
          isOpen={!!importErrorMessage}
          errorMessage={importErrorMessage}
          onClose={() => setImportErrorMessage(null)}
        />
      )}
    </div>
  );
};
