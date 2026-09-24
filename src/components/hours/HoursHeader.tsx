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
    <div className="space-y-3.5">
      {/* Editorial Title & Subtitle matching LifeInHoursHeader.kt */}
      <div className="space-y-0.5">
        <h1 className="font-editorial-serif text-[28px] leading-[34px] font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
          The life within
        </h1>
        <h1 className="font-editorial-serif text-[28px] leading-[34px] font-normal text-nudge-blue dark:text-nudge-blue-light">
          the hours
        </h1>
        <p className="text-[15px] sm:text-base font-semibold tracking-[-0.2px] text-nudge-text-primary dark:text-nudge-text-primary-dark pt-1">
          Choose where your hours go.
        </p>
      </div>

      {/* Month Selector Bar matching Android LifeInHoursHeader */}
      <div className="flex items-center justify-between p-1 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs max-w-sm w-full">
        {/* Previous Month */}
        <button
          type="button"
          onClick={onPreviousMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark transition-colors cursor-pointer shrink-0"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center: Month Name Clickable */}
        <button
          type="button"
          onClick={onMonthClick}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-white dark:hover:bg-neutral-800 text-nudge-text-primary dark:text-nudge-text-primary-dark transition-colors cursor-pointer min-w-0"
          aria-label="Select month and year"
        >
          <CalendarIcon className="w-4 h-4 text-nudge-blue shrink-0" />
          <span className="text-sm font-bold tracking-tight truncate">
            {monthName}
          </span>
        </button>

        {/* Right: Today pill (if not current month) + Next Month */}
        <div className="flex items-center gap-1 shrink-0">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onCurrentMonth}
              className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-nudge-blue dark:text-nudge-blue-light text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={onNextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark transition-colors cursor-pointer shrink-0"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
