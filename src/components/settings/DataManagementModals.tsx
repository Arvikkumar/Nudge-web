import React from 'react';
import { AlertTriangle, Upload, Trash2, X, Check, ShieldAlert, FileText, Database } from 'lucide-react';
import { NudgeBackupData, BackupValidationResult } from '../../utils/backupRestore';

interface ImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validationResult: BackupValidationResult | null;
  filename: string;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  validationResult,
  filename,
}) => {
  if (!isOpen || !validationResult?.data) return null;

  const { summary } = validationResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 id="import-title" className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Restore Data Backup
              </h3>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark truncate max-w-[220px]">
                {filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-nudge-text-secondary hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-zinc-800 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning callout */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
            Importing this backup will replace your current Nudge data.
          </p>
        </div>

        {/* Backup Contents Summary */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider px-1">
            Contents to be restored
          </p>
          <div className="p-3 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/80 dark:border-nudge-border-dark/80 divide-y divide-nudge-border/40 dark:divide-nudge-border-dark/40 text-xs">
            <div className="flex items-center justify-between py-1.5 px-1">
              <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">Tasks & Notes</span>
              <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {summary?.tasksCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-1">
              <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">Time Goals / Pursuits</span>
              <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {summary?.pursuitsCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-1">
              <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">Logged Hours Records</span>
              <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {summary?.timeRecordsCount ?? 0}
              </span>
            </div>
            {summary?.userName && (
              <div className="flex items-center justify-between py-1.5 px-1">
                <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">Profile Name</span>
                <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  {summary.userName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Replace & Restore
          </button>
        </div>
      </div>
    </div>
  );
};

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-title"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="clear-title" className="text-base font-semibold text-rose-600 dark:text-rose-400">
                Permanently Clear All Data?
              </h3>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-nudge-text-secondary hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-zinc-800 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-1.5 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              Warning: Destructive Action
            </p>
            <p>
              This will permanently remove all your locally stored tasks, notes, pursuits, and time logs from this browser.
            </p>
            <p className="text-rose-700/80 dark:text-rose-400/80">
              Only data belonging to the Nudge Web application will be removed. Your settings and workspace will be reset to a clean default state.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Yes, Permanently Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
}

export const ImportErrorModal: React.FC<ImportErrorModalProps> = ({
  isOpen,
  onClose,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Invalid Backup File
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Import could not proceed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-nudge-text-secondary hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
          <p className="font-medium">{errorMessage}</p>
          <p className="mt-2 text-rose-600/80 dark:text-rose-400/80">
            Your existing data was left completely untouched.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-text-primary dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
