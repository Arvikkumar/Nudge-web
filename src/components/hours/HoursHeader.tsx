import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface HoursHeaderProps {
  selectedYear: number;
  selectedMonth: number; // 1-12
  isCurrentMonth: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onMonthClick: () => void;
}

export const HoursHeader: React.FC<HoursHeaderProps> = ({
  selectedYear,
  selectedMonth,
  isCurrentMonth,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  onMonthClick,
}) => {
  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Editorial Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
          The life within
        </h1>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
          the hours
        </h1>
        <p className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark pt-1">
          Choose where your hours go.
        </p>
      </div>

      {/* Month Selector Bar matching Android LifeInHoursHeader */}
      <div className="flex items-center justify-between p-1.5 sm:px-2 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs max-w-lg w-full">
        {/* Previous Month */}
        <button
          type="button"
          onClick={onPreviousMonth}
          className="p-2 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Month Name Clickable */}
        <button
          type="button"
          onClick={onMonthClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark transition-colors cursor-pointer"
          aria-label="Select month and year"
        >
          <CalendarIcon className="w-4 h-4 text-nudge-blue" />
          <span className="text-sm font-bold tracking-tight">
            {monthName}
          </span>
        </button>

        {/* Right: Today pill (if not current month) + Next Month */}
        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onCurrentMonth}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-nudge-blue dark:text-nudge-blue-light text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={onNextMonth}
            className="p-2 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
