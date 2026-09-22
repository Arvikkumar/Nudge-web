import React from 'react';
import { Sparkles, Calendar, X, ExternalLink } from 'lucide-react';
import { DueEventReminder } from '../../utils/eventReminderScheduler';
import { EVENT_CATEGORY_STYLES } from '../../utils/nudgeEvents';

interface EventReminderToastProps {
  reminder: DueEventReminder;
  onDismiss: () => void;
  onViewDate?: (dateIso: string) => void;
}

export const EventReminderToast: React.FC<EventReminderToastProps> = ({
  reminder,
  onDismiss,
  onViewDate,
}) => {
  const categoryStyle = EVENT_CATEGORY_STYLES[reminder.event.category] || {
    bgLight: 'bg-[#F9F7F2]',
    textLight: 'text-[#3E2723]',
    badgeBgLight: 'bg-[#EDE8DE]',
    badgeTextLight: 'text-[#3E2723]',
    bgDark: 'dark:bg-[#201D1A]',
    textDark: 'dark:text-[#D7CCC8]',
    badgeBgDark: 'dark:bg-[#3E3832]',
    badgeTextDark: 'dark:text-[#D7CCC8]',
    dotColor: '#D97706',
  };

  return (
    <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white dark:bg-nudge-card-dark rounded-2xl shadow-xl border border-amber-500/30 dark:border-amber-400/30 p-4 space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-700/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryStyle.badgeBgLight} ${categoryStyle.badgeTextLight} ${categoryStyle.badgeBgDark} ${categoryStyle.badgeTextDark}`}
                >
                  {reminder.event.category}
                </span>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  • {reminder.timingLabel}
                </span>
              </div>
              <h3 className="text-base font-serif text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {reminder.event.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-nudge-text-secondary hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
            title="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Observance description note */}
        {reminder.event.description && (
          <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark line-clamp-2 leading-relaxed pl-1">
            {reminder.event.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-nudge-border/60 dark:border-nudge-border-dark/60">
          <span className="text-[11px] text-nudge-text-muted dark:text-nudge-text-muted-dark">
            Important Date Reminder
          </span>

          <div className="flex items-center gap-2">
            {onViewDate && (
              <button
                type="button"
                onClick={() => onViewDate(reminder.eventDateIso)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark bg-nudge-parchment dark:bg-nudge-parchment-dark hover:text-nudge-text-primary hover:bg-nudge-border/50 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>View Date</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <span>Got it</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
