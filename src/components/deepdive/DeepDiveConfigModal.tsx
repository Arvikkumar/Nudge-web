import React, { useState } from 'react';
import { X, Clock, Sliders, Bell, Plus, Trash2, Check, Radio } from 'lucide-react';
import {
  formatClockTime,
  formatDurationLabel,
  DeepDiveReminderPoint,
} from '../../utils/deepDive';

interface DeepDiveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (
    endTimeMillis: number,
    durationMinutes: number,
    style: 'One Shot' | 'Full Ringtone',
    reminders: DeepDiveReminderPoint[]
  ) => void;
}

export const DeepDiveConfigModal: React.FC<DeepDiveConfigModalProps> = ({
  isOpen,
  onClose,
  onStartSession,
}) => {
  const [selectedDurationOption, setSelectedDurationOption] = useState<'30m' | '1h' | 'custom'>('30m');
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [notificationStyle, setNotificationStyle] = useState<'One Shot' | 'Full Ringtone'>('One Shot');
  const [reminders, setReminders] = useState<DeepDiveReminderPoint[]>([]);

  if (!isOpen) return null;

  // Determine effective duration in minutes
  const totalCustomMinutes = customHours * 60 + customMinutes;
  const effectiveMinutes =
    selectedDurationOption === '30m'
      ? 30
      : selectedDurationOption === '1h'
      ? 60
      : Math.max(5, totalCustomMinutes);

  const now = Date.now();
  const calculatedEndTimeMillis = now + effectiveMinutes * 60 * 1000;
  const calculatedEndTimeClock = formatClockTime(calculatedEndTimeMillis);

  const handleStart = () => {
    onStartSession(calculatedEndTimeMillis, effectiveMinutes, notificationStyle, reminders);
    onClose();
  };

  const addPresetReminder = (offsetMinutesBeforeEnd: number, label: string) => {
    if (offsetMinutesBeforeEnd >= effectiveMinutes) return;
    const triggerTime = calculatedEndTimeMillis - offsetMinutesBeforeEnd * 60 * 1000;
    if (triggerTime <= now) return;

    if (reminders.some((r) => r.triggerTimeMillis === triggerTime)) return;

    const newReminder: DeepDiveReminderPoint = {
      id: `rem_${Date.now()}_${offsetMinutesBeforeEnd}`,
      triggerTimeMillis: triggerTime,
      label,
      subLabel: `${offsetMinutesBeforeEnd}m before finish`,
    };
    setReminders([...reminders, newReminder]);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl shadow-xl border border-nudge-border dark:border-nudge-border-dark overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-nudge-border/50 dark:border-nudge-border-dark/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Deep Dive
            </span>
            <h2 className="text-xl font-serif text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              How long do you want to stay with this?
            </h2>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-1">
              Choose a quiet stretch of dedicated time without disruptions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Duration Choices */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Duration
            </label>

            {/* 30 Minutes Option */}
            <div
              onClick={() => setSelectedDurationOption('30m')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedDurationOption === '30m'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/20'
                  : 'bg-white dark:bg-nudge-card-dark border-nudge-border dark:border-nudge-border-dark hover:border-nudge-text-secondary/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 ${selectedDurationOption === '30m' ? 'text-emerald-600 dark:text-emerald-400' : 'text-nudge-text-secondary'}`} />
                <span className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  30 minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  until {formatClockTime(now + 30 * 60 * 1000)}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedDurationOption === '30m'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-nudge-border dark:border-nudge-border-dark'
                  }`}
                >
                  {selectedDurationOption === '30m' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            {/* 1 Hour Option */}
            <div
              onClick={() => setSelectedDurationOption('1h')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedDurationOption === '1h'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/20'
                  : 'bg-white dark:bg-nudge-card-dark border-nudge-border dark:border-nudge-border-dark hover:border-nudge-text-secondary/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 ${selectedDurationOption === '1h' ? 'text-emerald-600 dark:text-emerald-400' : 'text-nudge-text-secondary'}`} />
                <span className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  1 hour
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  until {formatClockTime(now + 60 * 60 * 1000)}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedDurationOption === '1h'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-nudge-border dark:border-nudge-border-dark'
                  }`}
                >
                  {selectedDurationOption === '1h' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            {/* Custom Option */}
            <div
              onClick={() => {
                setSelectedDurationOption('custom');
                setShowCustomPicker(true);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
                selectedDurationOption === 'custom'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/20'
                  : 'bg-white dark:bg-nudge-card-dark border-nudge-border dark:border-nudge-border-dark hover:border-nudge-text-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sliders className={`w-4 h-4 ${selectedDurationOption === 'custom' ? 'text-emerald-600 dark:text-emerald-400' : 'text-nudge-text-secondary'}`} />
                  <span className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                    Custom {selectedDurationOption === 'custom' ? `(${formatDurationLabel(totalCustomMinutes)})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDurationOption === 'custom' && (
                    <span className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                      until {formatClockTime(now + totalCustomMinutes * 60 * 1000)}
                    </span>
                  )}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedDurationOption === 'custom'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-nudge-border dark:border-nudge-border-dark'
                    }`}
                  >
                    {selectedDurationOption === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Custom Picker Expanded */}
              {selectedDurationOption === 'custom' && (
                <div
                  className="pt-2 border-t border-emerald-500/20 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '1h 30m', mins: 90 },
                      { label: '2h', mins: 120 },
                      { label: '2h 30m', mins: 150 },
                      { label: '3h', mins: 180 },
                    ].map((preset) => {
                      const isSelected = totalCustomMinutes === preset.mins;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setCustomHours(Math.floor(preset.mins / 60));
                            setCustomMinutes(preset.mins % 60);
                          }}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                              : 'bg-white dark:bg-nudge-card-dark text-nudge-text-secondary hover:text-nudge-text-primary border border-nudge-border dark:border-nudge-border-dark'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Steppers */}
                  <div className="flex items-center justify-between gap-4 bg-white/70 dark:bg-nudge-parchment-dark/70 p-3 rounded-xl border border-nudge-border/60 dark:border-nudge-border-dark/60">
                    {/* Hours */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-nudge-text-secondary">Hours:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomHours((h) => Math.max(0, h - 1))}
                          className="w-7 h-7 rounded-lg bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                          {customHours}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomHours((h) => Math.min(12, h + 1))}
                          className="w-7 h-7 rounded-lg bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Minutes */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-nudge-text-secondary">Minutes:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomMinutes((m) => Math.max(0, m - 5))}
                          className="w-7 h-7 rounded-lg bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                          {customMinutes}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomMinutes((m) => Math.min(55, m + 5))}
                          className="w-7 h-7 rounded-lg bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Reminders Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  Add Reminders (Optional)
                </label>
                <p className="text-[11px] text-nudge-text-muted dark:text-nudge-text-muted-dark">
                  Set gentle checkpoint chimes during this Deep Dive.
                </p>
              </div>
            </div>

            {/* List of active reminders */}
            {reminders.length > 0 && (
              <div className="space-y-1.5">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
                        {rem.label}
                      </span>
                      <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                        at {formatClockTime(rem.triggerTimeMillis)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReminder(rem.id)}
                      className="p-1 rounded-md text-nudge-text-secondary hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preset Reminder Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '15m before end', mins: 15 },
                { label: '30m before end', mins: 30 },
                { label: '45m before end', mins: 45 },
              ]
                .filter((p) => p.mins < effectiveMinutes)
                .map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => addPresetReminder(p.mins, p.label)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark text-nudge-text-secondary hover:text-emerald-600 hover:border-emerald-500 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{p.label}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Notification Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Notification Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNotificationStyle('One Shot')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  notificationStyle === 'One Shot'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-nudge-card-dark border-nudge-border dark:border-nudge-border-dark'
                }`}
              >
                <p className="text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  One Shot
                </p>
                <p className="text-[11px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                  Single calm bell upon finishing
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNotificationStyle('Full Ringtone')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  notificationStyle === 'Full Ringtone'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-nudge-card-dark border-nudge-border dark:border-nudge-border-dark'
                }`}
              >
                <p className="text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  Full Ringtone
                </p>
                <p className="text-[11px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                  Prominent rhythmic chime
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-nudge-cream/40 dark:bg-nudge-dark/40 border-t border-nudge-border/50 dark:border-nudge-border-dark/50 flex items-center justify-between gap-3">
          <div className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
            Until <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">{calculatedEndTimeClock}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Begin Deep Dive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
