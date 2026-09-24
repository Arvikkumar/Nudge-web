import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MonthYearPickerDialogProps {
  isOpen: boolean;
  currentYear: number;
  currentMonth: number; // 1-12
  onDismiss: () => void;
  onSelectMonthYear: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MonthYearPickerDialog: React.FC<MonthYearPickerDialogProps> = ({
  isOpen,
  currentYear,
  currentMonth,
  onDismiss,
  onSelectMonthYear,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark p-6 w-full max-w-sm shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
            Select Month & Year
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Selector Row */}
        <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70">
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-nudge-card-dark text-nudge-text-secondary hover:text-nudge-text-primary transition-colors cursor-pointer"
            aria-label="Previous year"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-base font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-wide">
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-nudge-card-dark text-nudge-text-secondary hover:text-nudge-text-primary transition-colors cursor-pointer"
            aria-label="Next year"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {MONTH_NAMES.map((name, idx) => {
            const mNum = idx + 1;
            const isSelected =
              selectedYear === currentYear && mNum === currentMonth;

            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelectMonthYear(selectedYear, mNum);
                  onDismiss();
                }}
                className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-nudge-blue text-white shadow-2xs font-bold scale-[1.02]'
                    : 'bg-nudge-parchment/40 dark:bg-nudge-parchment-dark/40 hover:bg-nudge-blue/10 dark:hover:bg-nudge-blue/20 text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/50 dark:border-nudge-border-dark/50'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Close button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary hover:text-nudge-text-primary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
