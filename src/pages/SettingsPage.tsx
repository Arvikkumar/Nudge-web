import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Clock,
  Sliders,
  Volume2,
  ShieldCheck,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileDown,
  History,
  Calendar,
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
import { ThemeToggleSwitch } from '../components/settings/ThemeToggleSwitch';
import { MinimalAnalogClock } from '../components/settings/MinimalAnalogClock';
import { MinimalAccordionSection } from '../components/settings/MinimalAccordionSection';
import {
  SettingToggleRow,
  SettingActionRow,
  SettingInfoRow,
} from '../components/settings/SettingRow';

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

  // Accordion state: Only the selected accordion expands ('alerts' | 'backup' | 'history' | null)
  const [expandedSection, setExpandedSection] = useState<'alerts' | 'backup' | 'history' | null>('alerts');

  // Backup & schedule states
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('nudge_auto_backup_enabled') === 'true';
  });
  const [lastManualBackupText, setLastManualBackupText] = useState<string>(() => {
    return localStorage.getItem('nudge_last_manual_backup_relative') || 'None recorded';
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDay, setScheduleDay] = useState<string>(() => {
    return localStorage.getItem('nudge_auto_backup_day') || 'Every Sunday';
  });
  const [scheduleTime, setScheduleTime] = useState<string>(() => {
    return localStorage.getItem('nudge_auto_backup_time') || '23:00';
  });

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  // Theme resolution
  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggleTheme = () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    onUpdateSettings({ themeMode: nextMode });
    showFeedback(`Switched to ${nextMode} theme`);
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
      const timeStr = 'Just now';
      setLastManualBackupText(timeStr);
      localStorage.setItem('nudge_last_manual_backup_relative', timeStr);
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
      } catch {
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

  const toggleSection = (section: 'alerts' | 'backup' | 'history') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pb-12"
      data-testid="settings_screen"
    >
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-nudge-blue text-white text-xs sm:text-sm font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-3">
          {feedbackMessage}
        </div>
      )}

      {/* Page Heading & Day/Night Theme Toggle Switch (Android Layout) */}
      <div className="pt-2 pb-1 flex items-center justify-between">
        <div>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight tracking-[-0.5px]">
            Settings that
          </h1>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight tracking-[-0.5px]">
            fit your rhythm.
          </h1>
        </div>

        {/* Day/Night Theme Toggle Switch */}
        <ThemeToggleSwitch
          isDark={isDark}
          onToggle={handleToggleTheme}
        />
      </div>

      {/* Clean, minimal accordion sections: Alerts, Backup, History */}
      <div
        className="w-full space-y-1"
        data-testid="minimal_accordion_container"
      >
        {/* 1. Alerts Section */}
        <MinimalAccordionSection
          title="Alerts"
          isExpanded={expandedSection === 'alerts'}
          onToggle={() => toggleSection('alerts')}
          testTag="alerts_accordion_section"
        >
          {/* Notifications Toggle */}
          <SettingToggleRow
            icon={<Bell className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Notifications"
            description="A little tap when something matters"
            checked={settings.notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            testTag="toggle_notifications"
          />

          {/* Default Snooze */}
          <SettingActionRow
            icon={<Clock className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Default snooze"
            description="A little breathing room"
            actionText={`${settings.defaultSnooze || '15 minutes'} ⌵`}
            onClick={handleCycleSnooze}
            testTag="action_default_snooze"
          />

          {/* Nudge Again */}
          <SettingToggleRow
            icon={<Sliders className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Nudge again"
            description="Ask again, softly, if I miss it"
            checked={settings.nudgeAgainEnabled}
            onCheckedChange={handleToggleNudgeAgain}
            testTag="toggle_nudge_again"
          />

          {/* Gentle Chime Sound Setting */}
          <SettingActionRow
            icon={<Volume2 className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Gentle chime"
            description="Soothing bell tone played on reminder alerts"
            actionText="Test Chime"
            onClick={handleTestChime}
            testTag="action_test_chime"
          />

          {/* Celebrations & Observances Advance Reminders */}
          <div className="py-3 sm:py-3.5">
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-[-0.1px]">
                  Celebrations & Observances
                </p>
                <p className="text-xs sm:text-[13px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-0.5 leading-snug">
                  Gentle advance reminders for important calendar observances
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pl-[52px]">
              {(['off', '1_day', '2_days', 'custom'] as EventReminderOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectEventReminderOption(opt)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    settings.eventReminderOption === opt
                      ? 'bg-nudge-blue text-white border-nudge-blue shadow-xs'
                      : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border-nudge-border/60 dark:border-nudge-border-dark/60 hover:border-nudge-blue'
                  }`}
                >
                  {opt === 'off' && 'Off'}
                  {opt === '1_day' && '1 Day Before'}
                  {opt === '2_days' && '2 Days Before'}
                  {opt === 'custom' && `${settings.eventReminderCustomDays || 3} Days`}
                </button>
              ))}
            </div>
          </div>

          {/* Browser Permission Row */}
          {browserPermission !== 'granted' && (
            <SettingActionRow
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              iconBgColor="bg-emerald-500/10"
              iconTextColor="text-emerald-600 dark:text-emerald-400"
              title="Browser notifications"
              description={
                browserPermission === 'denied'
                  ? 'Notifications blocked in browser preferences'
                  : 'Enable browser alerts for background reminders'
              }
              actionText={browserPermission === 'denied' ? 'Blocked' : 'Enable'}
              onClick={handleRequestPermission}
              disabled={browserPermission === 'denied'}
              testTag="action_browser_permission"
            />
          )}
        </MinimalAccordionSection>

        {/* 2. Backup Section */}
        <MinimalAccordionSection
          title="Backup"
          isExpanded={expandedSection === 'backup'}
          onToggle={() => toggleSection('backup')}
          testTag="backup_accordion_section"
        >
          {/* Last Manual Backup */}
          <SettingInfoRow
            icon={<Upload className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Last manual backup"
            description="Confirmed timestamp of your latest manual export"
            valueText={lastManualBackupText}
          />

          {/* Last Automatic Backup */}
          <SettingInfoRow
            icon={<History className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Last automatic backup"
            description="Confirmed timestamp of your latest automatic backup"
            valueText={autoBackupEnabled ? 'Scheduled' : 'None yet'}
          />

          {/* Automatic Backup Toggle */}
          <SettingToggleRow
            icon={<RotateCcw className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Automatic Backup"
            description="Automatically create a local backup of my Nudge data"
            checked={autoBackupEnabled}
            onCheckedChange={(val) => {
              setAutoBackupEnabled(val);
              localStorage.setItem('nudge_auto_backup_enabled', String(val));
              showFeedback(val ? 'Automatic backup active' : 'Automatic backup turned off');
            }}
          />

          {/* Recurring Schedule Details when Automatic Backup is active */}
          {autoBackupEnabled && (
            <>
              <SettingActionRow
                icon={<Calendar className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
                title="Backup schedule"
                description="Recurring local backup schedule"
                actionText={`${scheduleDay} at ${scheduleTime} ⌵`}
                onClick={() => setShowScheduleModal(true)}
              />
              <SettingInfoRow
                icon={<Clock className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
                title="Next backup"
                description="Scheduled automatic local backup"
                valueText={`${scheduleDay.replace('Every ', '')} ${scheduleTime}`}
              />
            </>
          )}

          {/* Create Local Backup */}
          <SettingActionRow
            icon={<Download className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Create Local Backup"
            description="Export all your notes, pursuits, settings, and attachments to a safe backup file"
            actionText={isExporting ? 'Exporting…' : 'Backup'}
            onClick={handleExportData}
            disabled={isExporting}
            testTag="action_create_backup"
          />

          {/* Restore Local Backup */}
          <SettingActionRow
            icon={<Upload className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Restore Local Backup"
            description="Recover notes, pursuits, and attachments from a previously saved backup file"
            actionText="Restore"
            onClick={handleTriggerImport}
            testTag="action_restore_backup"
          />

          {/* Clear all data */}
          <SettingActionRow
            icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            iconBgColor="bg-rose-500/10"
            iconTextColor="text-rose-600 dark:text-rose-400"
            title="Clear all data"
            description="Start fresh with a clean slate"
            actionText="Reset"
            isDestructive={true}
            onClick={() => setIsClearModalOpen(true)}
            testTag="action_clear_data"
          />
        </MinimalAccordionSection>

        {/* 3. History Section */}
        <MinimalAccordionSection
          title="History"
          isExpanded={expandedSection === 'history'}
          onToggle={() => toggleSection('history')}
          testTag="history_accordion_section"
        >
          {/* Recently Deleted */}
          <SettingActionRow
            icon={<RotateCcw className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Recently Deleted"
            description="Recover deleted reminders within 30 days"
            actionText={deletedTasksCount > 0 ? `${deletedTasksCount} items ›` : 'View ›'}
            onClick={() => {
              if (onOpenRecentlyDeleted) onOpenRecentlyDeleted();
            }}
            testTag="action_recently_deleted"
          />

          {/* Export History (PDF) */}
          <SettingActionRow
            icon={<FileDown className="w-5 h-5 text-nudge-blue dark:text-nudge-blue-light" />}
            title="Export History (PDF)"
            description="Download a complete, offline PDF copy of all your completed & pending notes"
            actionText="Export PDF"
            onClick={() => {
              window.location.hash = 'hours';
            }}
            testTag="action_export_pdf"
          />
        </MinimalAccordionSection>
      </div>

      {/* Brand Signature Quote Footer */}
      <div className="pt-10 pb-2 text-center select-none">
        <p className="font-editorial-serif italic text-[13.5px] leading-relaxed text-nudge-text-secondary/80 dark:text-nudge-text-secondary-dark/80 max-w-sm mx-auto">
          &ldquo;A jack of all trades is master of none,
          <br />
          but often better than a master of one.&rdquo;
        </p>
      </div>

      {/* Real-time Minimal Analog Clock Footer */}
      <div className="pt-4 pb-8 flex items-center justify-center select-none">
        <MinimalAnalogClock size={200} />
      </div>

      {/* Hidden File Input for Backup Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelected}
        className="hidden"
        data-testid="backup_file_input"
      />

      {/* Backup Schedule Selection Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
              Automatic Backup Schedule
            </h3>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Select recurring day and time to generate a local backup:
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nudge-blue">Frequency / Day:</label>
              <select
                value={scheduleDay}
                onChange={(e) => {
                  setScheduleDay(e.target.value);
                  localStorage.setItem('nudge_auto_backup_day', e.target.value);
                }}
                className="w-full py-2 px-3 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-xs font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark outline-none"
              >
                {['Every day', 'Every Sunday', 'Every Monday', 'Every Tuesday', 'Every Wednesday', 'Every Thursday', 'Every Friday', 'Every Saturday'].map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nudge-blue">Time:</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => {
                  setScheduleTime(e.target.value);
                  localStorage.setItem('nudge_auto_backup_time', e.target.value);
                }}
                className="w-full py-2 px-3 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-xs font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark outline-none"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  showFeedback('Backup schedule saved');
                }}
                className="py-1.5 px-4 rounded-xl text-xs font-semibold bg-nudge-blue text-white shadow-xs hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
