import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { Pursuit, TimeGoalRecord } from '../../types';

interface DailyTimeEntryModalProps {
  isOpen: boolean;
  pursuit: Pursuit;
  dateStr: string; // YYYY-MM-DD
  existingRecord?: TimeGoalRecord | null;
  onDismiss: () => void;
  onSave: (minutes: number, note?: string) => Promise<void>;
}

export const DailyTimeEntryModal: React.FC<DailyTimeEntryModalProps> = ({
  isOpen,
  pursuit,
  dateStr,
  existingRecord,
  onDismiss,
  onSave,
}) => {
  const initialMinutes = existingRecord?.minutes ?? 0;
  const [minutesLogged, setMinutesLogged] = useState<number>(initialMinutes);
  const [note, setNote] = useState<string>(existingRecord?.note || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Daily target in minutes (derived from monthly target: targetHours * 60 / 30 = targetHours * 2)
  const dailyTargetMinutes = Math.max(15, Math.round((pursuit.targetHours * 60) / 30));

  const presets = [
    { label: `Target (${dailyTargetMinutes}m)`, mins: dailyTargetMinutes },
    { label: '+15m', mins: minutesLogged + 15 },
    { label: '+30m', mins: minutesLogged + 30 },
    { label: '+45m', mins: minutesLogged + 45 },
    { label: '1 hour', mins: 60 },
    { label: '1h 30m', mins: 90 },
    { label: '2 hours', mins: 120 },
    { label: '3 hours', mins: 180 },
    { label: 'Clear (0m)', mins: 0 },
  ];

  const formatDisplayDuration = (mins: number) => {
    if (mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const formattedDate = (() => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  })();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(minutesLogged, note.trim() ? note.trim() : undefined);
      onDismiss();
    } catch (err) {
      console.error('Failed to save daily entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark p-6 w-full max-w-md shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-nudge-blue">
              Record time for {pursuit.name}
            </span>
            <h3 className="text-base font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              {formattedDate}
            </h3>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Duration Display Card */}
        <div className="p-5 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70 text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-bold font-editorial-serif text-nudge-text-primary dark:text-nudge-text-primary-dark">
            {formatDisplayDuration(minutesLogged)}
          </div>
          <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
            Daily Target: {formatDisplayDuration(dailyTargetMinutes)}
          </p>
        </div>

        {/* Presets Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider">
            Quick Adjust
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMinutesLogged(Math.max(0, p.mins))}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-white dark:bg-nudge-card-dark hover:bg-nudge-blue hover:text-white border border-nudge-border dark:border-nudge-border-dark text-nudge-text-primary dark:text-nudge-text-primary-dark transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider">
            Note / Reflection (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Stoic reflection on resilience..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-transparent text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary hover:text-nudge-text-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-nudge-blue text-white hover:bg-nudge-blue-hover transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Time'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
