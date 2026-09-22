import React from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { NudgeTask } from '../../types';

interface NotificationToastProps {
  task: NudgeTask;
  onComplete: () => void;
  onSnooze: (snoozeType: '30m' | 'tonight' | 'tomorrow') => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  task,
  onComplete,
  onSnooze,
  onDismiss,
}) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white dark:bg-nudge-card-dark rounded-2xl shadow-xl border border-nudge-blue/30 dark:border-nudge-blue/40 p-4 space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-nudge-blue-container/50 dark:bg-nudge-blue-container-dark/50 text-nudge-blue flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-nudge-blue">
                  {task.category || 'Nudge Reminder'}
                </span>
                {task.timeLabel && (
                  <span className="text-[10px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                    • {task.timeLabel}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5 line-clamp-2">
                {task.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-nudge-text-secondary hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-nudge-border/50 dark:border-nudge-border-dark/50">
          <button
            type="button"
            onClick={() => onSnooze('30m')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark bg-nudge-parchment dark:bg-nudge-parchment-dark hover:text-nudge-text-primary hover:bg-nudge-border/50 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Snooze (30m)</span>
          </button>

          <button
            type="button"
            onClick={() => onComplete()}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-nudge-blue hover:bg-nudge-blue-hover text-white shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
