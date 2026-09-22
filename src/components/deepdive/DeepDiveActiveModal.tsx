import React, { useState, useEffect } from 'react';
import { X, Hourglass, Bell, AlertTriangle, StopCircle } from 'lucide-react';
import {
  DeepDiveState,
  formatClockTime,
  formatTimeRemaining,
  formatDurationLabel,
} from '../../utils/deepDive';

interface DeepDiveActiveModalProps {
  isOpen: boolean;
  state: DeepDiveState;
  onClose: () => void;
  onEndSession: () => void;
}

export const DeepDiveActiveModal: React.FC<DeepDiveActiveModalProps> = ({
  isOpen,
  state,
  onClose,
  onEndSession,
}) => {
  const [now, setNow] = useState(Date.now());
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  // Update live clock every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedClock = formatClockTime(state.endTimeMillis);
  const remainingStr = formatTimeRemaining(state.endTimeMillis, now);

  const handleConfirmEnd = () => {
    setShowConfirmEnd(false);
    onEndSession();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl shadow-xl border border-nudge-border dark:border-nudge-border-dark overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-nudge-border/50 dark:border-nudge-border-dark/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                Deep Dive in Progress
              </span>
            </div>
            <h2 className="text-2xl font-serif text-nudge-text-primary dark:text-nudge-text-primary-dark mt-1">
              Until {formattedClock}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Main Status Hero Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Hourglass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Time Remaining
              </p>
              <p className="text-xl font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark font-mono mt-0.5">
                {remainingStr}
              </p>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                Session started for {formatDurationLabel(state.durationMinutes)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-3.5 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Notification Style:
              </span>
              <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {state.notificationStyle}
              </span>
            </div>

            {state.reminderPoints && state.reminderPoints.length > 0 && (
              <div className="pt-2 border-t border-nudge-border/40 dark:border-nudge-border-dark/40 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Scheduled Checkpoints:
                </span>
                {state.reminderPoints.map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-nudge-text-primary dark:text-nudge-text-primary-dark">
                        {rem.label}
                      </span>
                    </div>
                    <span className="text-nudge-text-secondary">
                      {formatClockTime(rem.triggerTimeMillis)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmation Prompt when ending early */}
          {showConfirmEnd ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    End this Deep Dive early?
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    Your focus timer will be stopped. Are you sure you want to exit?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmEnd(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-nudge-text-secondary hover:text-nudge-text-primary"
                >
                  Stay in Focus
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEnd}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  Yes, End Session
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmEnd(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              <span>End Deep Dive</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
