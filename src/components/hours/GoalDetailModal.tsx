import React, { useState, useMemo } from 'react';
import { X, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pursuit, TimeGoalRecord } from '../../types';

interface GoalDetailModalProps {
  isOpen: boolean;
  pursuit: Pursuit;
  selectedYear: number;
  selectedMonth: number; // 1-12
  records: TimeGoalRecord[];
  onDismiss: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDayClick: (dateIso: string, record?: TimeGoalRecord) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  isOpen,
  pursuit,
  selectedYear,
  selectedMonth,
  records,
  onDismiss,
  onEdit,
  onDelete,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Month calculation
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const leadBlanks = (firstDayOfWeek + 6) % 7;

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth;
  const currentDay = now.getDate();

  // Daily target in minutes
  const dailyTargetMinutes = Math.max(15, Math.round((pursuit.targetHours * 60) / 30));

  // Filter records for this pursuit in this month
  const pursuitRecordsMap = useMemo(() => {
    const map = new Map<string, TimeGoalRecord>();
    records.forEach((r) => {
      if (r.pursuitId === pursuit.id) {
        map.set(r.date, r);
      }
    });
    return map;
  }, [records, pursuit.id]);

  // Aggregate stats
  const { totalInvestedMinutes, completedDays } = useMemo(() => {
    let totalMins = 0;
    let completed = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateIso = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = pursuitRecordsMap.get(dateIso);
      const mins = rec?.minutes || 0;
      totalMins += mins;

      const isPastOrToday =
        selectedYear < now.getFullYear() ||
        (selectedYear === now.getFullYear() && selectedMonth < now.getMonth() + 1) ||
        (isCurrentMonth && d <= currentDay);

      if (isPastOrToday && mins >= dailyTargetMinutes) {
        completed++;
      }
    }

    return {
      totalInvestedMinutes: totalMins,
      completedDays: completed,
    };
  }, [selectedYear, selectedMonth, totalDaysInMonth, pursuitRecordsMap, dailyTargetMinutes, isCurrentMonth, currentDay, now]);

  if (!isOpen) return null;

  const monthTitle = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const investedHours = totalInvestedMinutes / 60;
  const progressPercent = Math.min(
    100,
    Math.round((investedHours / Math.max(1, pursuit.targetHours)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-nudge-card-dark rounded-t-[28px] sm:rounded-3xl border border-nudge-border/80 dark:border-nudge-border-dark/80 p-5 sm:p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto sm:hidden mb-1" />

        {/* Header: Pursuit Info & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              {pursuit.emoji || '🎯'}
            </div>
            <div className="truncate">
              <h3 className="font-editorial-serif text-xl sm:text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark truncate">
                {pursuit.name}
              </h3>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                {dailyTargetMinutes}m daily target
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              title="Edit Pursuit"
              className="p-1.5 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Pursuit"
              className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-nudge-text-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Metric Monthly Summary Card */}
        <div className="p-3.5 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70 grid grid-cols-4 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
              PLANNED
            </span>
            <p className="text-sm sm:text-base font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              {pursuit.targetHours}h
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
              INVESTED
            </span>
            <p className="text-sm sm:text-base font-bold text-nudge-blue mt-0.5">
              {investedHours.toFixed(1)}h
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
              PROGRESS
            </span>
            <p className="text-sm sm:text-base font-bold text-nudge-blue mt-0.5">
              {progressPercent}%
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
              COMPLETED
            </span>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedDays}d
            </p>
          </div>
        </div>

        {/* Calendar Section Header */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrevMonth}
                className="p-1 rounded-lg hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-blue transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold uppercase tracking-wider text-nudge-blue px-1">
                CALENDAR — {monthTitle}
              </span>

              <button
                type="button"
                onClick={onNextMonth}
                className="p-1 rounded-lg hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-blue transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[11px] text-nudge-text-muted">
              Tap day to log
            </span>
          </div>

          {/* Monthly Calendar Grid matching CalendarGridView.kt */}
          <div className="p-2.5 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 space-y-1.5">
            {/* Weekdays row */}
            <div className="grid grid-cols-7 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-bold text-nudge-text-secondary/70"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Lead blanks */}
              {Array.from({ length: leadBlanks }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-9" />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateIso = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const rec = pursuitRecordsMap.get(dateIso);
                const actualMins = rec?.minutes || 0;

                const isFuture =
                  selectedYear > now.getFullYear() ||
                  (selectedYear === now.getFullYear() && selectedMonth > now.getMonth() + 1) ||
                  (isCurrentMonth && dayNum > currentDay);

                const isDone = !isFuture && actualMins >= dailyTargetMinutes;
                const isPartial = !isFuture && actualMins > 0 && actualMins < dailyTargetMinutes;
                const isMissed = !isFuture && actualMins === 0;

                let symbol = '—';
                let cellBg = 'bg-white dark:bg-neutral-800/40';
                let textColor = 'text-nudge-text-secondary';

                if (isDone) {
                  symbol = '✓';
                  cellBg = 'bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40';
                  textColor = 'text-[#2E7D32] dark:text-emerald-300 font-bold';
                } else if (isPartial) {
                  symbol = '◐';
                  cellBg = 'bg-[#FFF3E0] dark:bg-amber-950/40 border-[#FFE0B2] dark:border-amber-800/40';
                  textColor = 'text-[#E65100] dark:text-amber-300 font-bold';
                } else if (isMissed) {
                  symbol = '—';
                  cellBg = 'bg-[#FBE9E7] dark:bg-rose-950/20 border-[#FFCCBC] dark:border-rose-900/30';
                  textColor = 'text-[#D84315] dark:text-rose-400';
                } else if (isFuture) {
                  symbol = '○';
                  cellBg = 'bg-nudge-parchment/20 dark:bg-neutral-900/40';
                  textColor = 'text-nudge-text-muted/60';
                }

                return (
                  <button
                    key={dateIso}
                    type="button"
                    onClick={() => onDayClick(dateIso, rec)}
                    className={`h-9 rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all hover:scale-105 relative cursor-pointer ${cellBg}`}
                  >
                    <span className="text-[10.5px] font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark leading-tight">
                      {dayNum}
                    </span>
                    <span className={`text-[9.5px] leading-tight ${textColor}`}>
                      {symbol}
                    </span>

                    {/* Note badge indicator */}
                    {rec?.note && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-nudge-blue" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-2 border-t border-nudge-border/50 dark:border-nudge-border-dark/50 flex items-center justify-around text-[10.5px]">
              <span className="flex items-center gap-1 text-[#2E7D32] dark:text-emerald-400 font-medium">
                <strong>✓</strong> Done
              </span>
              <span className="flex items-center gap-1 text-[#E65100] dark:text-amber-400 font-medium">
                <strong>◐</strong> Partial
              </span>
              <span className="flex items-center gap-1 text-[#D84315] dark:text-rose-400 font-medium">
                <strong>—</strong> Missed
              </span>
              <span className="flex items-center gap-1 text-nudge-text-muted font-medium">
                <strong>○</strong> Future
              </span>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold text-red-700 dark:text-red-300">
              Delete Pursuit "{pursuit.name}"?
            </h4>
            <p className="text-xs text-red-600 dark:text-red-400">
              This will remove this pursuit from your active list.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 rounded-xl text-xs font-medium text-nudge-text-secondary hover:text-nudge-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                  onDismiss();
                }}
                className="px-3.5 py-1 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
