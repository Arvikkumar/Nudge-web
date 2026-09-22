import React, { useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Bell,
  RefreshCw,
  Clock,
  ShieldCheck,
  FileDown,
  Info,
  Check,
  ShieldAlert,
  Sparkles,
  Calendar,
  Download,
  Upload,
  Trash2,
  Database,
  RotateCcw,
} from 'lucide-react';
import { ThemeMode, NudgeSettings, EventReminderOption } from '../types';
import { getNotificationPermission, requestNotificationPermission } from '../utils/reminderScheduler';
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

  const snoozeOptions = ['15m', '30m', '1 hour', 'Tomorrow'];

  const handleSelectTheme = (mode: ThemeMode) => {
    onUpdateSettings({ themeMode: mode });
    showFeedback(`Theme changed to ${mode}`);
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

  const handleSelectSnooze = (snooze: string) => {
    onUpdateSettings({ defaultSnooze: snooze });
    showFeedback(`Default snooze set to ${snooze}`);
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

  const handleChangeCustomDays = (days: number) => {
    onUpdateSettings({ eventReminderCustomDays: days });
    showFeedback(`Custom notice set to ${days} ${days === 1 ? 'day' : 'days'} before`);
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
      const content = event.target?.result;
      if (typeof content !== 'string') {
        setImportErrorMessage('Could not read the selected backup file.');
        return;
      }

      const validation = parseAndValidateBackupJson(content);
      if (!validation.isValid) {
        setImportErrorMessage(validation.error || 'The backup file is invalid.');
        return;
      }

      setImportValidation(validation);
      setIsImportModalOpen(true);
    };

    reader.onerror = () => {
      setImportErrorMessage('An error occurred while reading the file.');
    };

    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!importValidation?.data) return;

    try {
      await restoreBackupData(importValidation.data);
      setIsImportModalOpen(false);
      setImportValidation(null);
      showFeedback('Data restored successfully from backup');
    } catch (err) {
      console.error('Failed to restore backup:', err);
      setIsImportModalOpen(false);
      setImportErrorMessage('Failed to restore backup data. Existing data was preserved.');
    }
  };

  const handleConfirmClear = async () => {
    try {
      await clearAllLocalData();
      setIsClearModalOpen(false);
      showFeedback('All local Nudge data has been cleared');
    } catch (err) {
      console.error('Failed to clear data:', err);
      setIsClearModalOpen(false);
      showFeedback('Failed to clear local data');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with Editorial Title */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
          Customize your quiet rhythm, appearance, and data preferences.
        </p>
      </div>

      {/* Floating feedback toast */}
      {feedbackMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-nudge-text-primary text-white text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Appearance Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
          Appearance
        </h2>
        <div className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Theme
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Choose between warm paper cream or soothing charcoal
              </p>
            </div>

            {/* 3-way toggle: Light, System, Dark */}
            <div className="flex items-center gap-1 bg-nudge-parchment dark:bg-nudge-parchment-dark p-1 rounded-full border border-nudge-border/80 dark:border-nudge-border-dark/80">
              {(['light', 'system', 'dark'] as const).map((mode) => {
                const isSelected = settings.themeMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleSelectTheme(mode)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-nudge-card-dark text-nudge-blue shadow-xs font-semibold'
                        : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Reminders & Rhythm Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
          Reminders & Rhythm
        </h2>
        <div className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs divide-y divide-nudge-border/60 dark:divide-nudge-border-dark/60">
          {/* Notifications Toggle */}
          <div className="pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-nudge-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                    Gentle Notifications
                  </p>
                  <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                    Receive polite, quiet alerts for timed reminders
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  settings.notificationsEnabled
                    ? 'bg-nudge-blue justify-end'
                    : 'bg-nudge-border dark:bg-nudge-border-dark justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Browser Permission Sub-bar */}
            {settings.notificationsEnabled && (
              <div className="ml-8 p-2.5 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                    Browser status:{' '}
                  </span>
                  <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark capitalize">
                    {browserPermission === 'granted'
                      ? 'Enabled ✓'
                      : browserPermission === 'denied'
                      ? 'Blocked in browser'
                      : 'Permission needed'}
                  </span>
                </div>

                {browserPermission === 'default' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 rounded-lg bg-nudge-blue hover:bg-nudge-blue-hover text-white text-[11px] font-semibold transition-colors"
                  >
                    Enable in Browser
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Nudge Again Toggle */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-nudge-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  Nudge Again
                </p>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  Politely re-notify after snooze if still pending
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleNudgeAgain}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                settings.nudgeAgainEnabled
                  ? 'bg-nudge-blue justify-end'
                  : 'bg-nudge-border dark:bg-nudge-border-dark justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Default Snooze */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 gap-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-nudge-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  Default Snooze Duration
                </p>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  Standard interval when postponing a nudge
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {snoozeOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectSnooze(opt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    settings.defaultSnooze === opt
                      ? 'bg-nudge-blue text-white font-semibold'
                      : 'bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Event Reminders Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
          Event Reminders
        </h2>
        <div className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Important Observance Reminders
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Receive calm notifications ahead of cultural observances, national days, and global celebrations.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {[
              { id: 'off' as EventReminderOption, label: 'Off', desc: 'No reminders for upcoming events' },
              { id: '1_day' as EventReminderOption, label: '1 day before', desc: 'Remind on the eve of the event' },
              { id: '2_days' as EventReminderOption, label: '2 days before', desc: 'Remind two days in advance' },
              { id: 'custom' as EventReminderOption, label: 'Custom', desc: 'Choose a custom number of days before' },
            ].map((option) => {
              const isSelected = (settings.eventReminderOption || 'off') === option.id;
              return (
                <div key={option.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectEventReminderOption(option.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-nudge-text-primary dark:text-nudge-text-primary-dark shadow-xs'
                        : 'bg-white dark:bg-nudge-card-dark border-nudge-border/80 dark:border-nudge-border-dark/80 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:border-nudge-border dark:hover:border-nudge-border-dark'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 dark:border-amber-400 dark:bg-amber-400'
                          : 'border-nudge-border dark:border-nudge-border-dark bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? 'font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark'
                              : 'text-nudge-text-primary dark:text-nudge-text-primary-dark'
                          }`}
                        >
                          {option.label}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                        {option.desc}
                      </p>
                    </div>
                  </button>

                  {/* Day selector if Custom is selected */}
                  {option.id === 'custom' && isSelected && (
                    <div className="mt-2 ml-7 p-3 rounded-xl bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 border border-nudge-border/70 dark:border-nudge-border-dark/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div>
                        <p className="text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                          Notice window:
                        </p>
                        <p className="text-[11px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                          Remind {settings.eventReminderCustomDays || 3} { (settings.eventReminderCustomDays || 3) === 1 ? 'day' : 'days' } before the event date
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChangeCustomDays(Math.max(1, (settings.eventReminderCustomDays || 3) - 1))}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark text-nudge-text-primary dark:text-nudge-text-primary-dark font-bold hover:bg-nudge-parchment transition-colors flex items-center justify-center text-sm"
                          title="Decrease days"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark min-w-[60px] text-center px-2 py-1 bg-white dark:bg-nudge-card-dark rounded-lg border border-nudge-border dark:border-nudge-border-dark">
                          {settings.eventReminderCustomDays || 3} { (settings.eventReminderCustomDays || 3) === 1 ? 'day' : 'days' }
                        </span>
                        <button
                          type="button"
                          onClick={() => handleChangeCustomDays(Math.min(30, (settings.eventReminderCustomDays || 3) + 1))}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark text-nudge-text-primary dark:text-nudge-text-primary-dark font-bold hover:bg-nudge-parchment transition-colors flex items-center justify-center text-sm"
                          title="Increase days"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data & Safety Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
          Data & Safety
        </h2>
        <div className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FileDown className="w-5 h-5 text-nudge-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  Offline Local Storage
                </p>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  Your tasks, notes, habits, and hours remain stored securely in your browser's IndexedDB.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
          Data Management
        </h2>
        <div className="rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs divide-y divide-nudge-border/60 dark:divide-nudge-border-dark/60">
          {/* Export Data */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  Export Data
                </p>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark max-w-md leading-relaxed">
                  Download a complete JSON backup of your tasks, notes, pursuits, time logs, and preferences.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={isExporting}
              className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-parchment dark:bg-zinc-800 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment/80 dark:hover:bg-zinc-700/80 border border-nudge-border dark:border-nudge-border-dark transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </button>
          </div>

          {/* Import Data */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  Import Data
                </p>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark max-w-md leading-relaxed">
                  Restore your saved tasks, pursuits, and preferences from a previously exported Nudge backup file.
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json,application/json"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleTriggerImport}
              className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-parchment dark:bg-zinc-800 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment/80 dark:hover:bg-zinc-700/80 border border-nudge-border dark:border-nudge-border-dark transition-colors flex items-center gap-2 shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Backup
            </button>
          </div>

          {/* Recently Deleted / Trash */}
          {onOpenRecentlyDeleted && (
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                      Recently Deleted Tasks
                    </p>
                    {deletedTasksCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {deletedTasksCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark max-w-md leading-relaxed">
                    Review and restore previously deleted nudges back to your daily task list.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenRecentlyDeleted}
                className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-parchment dark:bg-zinc-800 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment/80 dark:hover:bg-zinc-700/80 border border-nudge-border dark:border-nudge-border-dark transition-colors flex items-center gap-2 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                View Trash ({deletedTasksCount})
              </button>
            </div>
          )}

          {/* Clear All Data */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  Clear All Data
                </p>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark max-w-md leading-relaxed">
                  Permanently remove all locally stored Nudge records and reset to clean factory defaults.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-2 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Data
            </button>
          </div>
        </div>
      </section>

      {/* About Nudge Section */}
      <section className="rounded-3xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/80 dark:border-nudge-border-dark/80 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark flex items-center justify-center text-lg shrink-0">
            🪴
          </div>
          <div>
            <h3 className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
              nudge web • v2.0
            </h3>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5 leading-relaxed">
              A quiet, warm, private reminder and memory assistant. Built to gently accompany your days without anxiety, algorithmic noise, or clutter.
            </p>
          </div>
        </div>
      </section>

      {/* Backup & Restore Modals */}
      <ImportConfirmModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportValidation(null);
        }}
        onConfirm={handleConfirmRestore}
        validationResult={importValidation}
        filename={selectedFileName}
      />

      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
      />

      <ImportErrorModal
        isOpen={Boolean(importErrorMessage)}
        onClose={() => setImportErrorMessage(null)}
        errorMessage={importErrorMessage || ''}
      />
    </div>
  );
};
