import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { NudgeTask } from '../../types';
import { doesTaskOccurOnDate, formatDateToIso, parseIsoToDate } from '../../utils/recurrence';
import { getEventsForDate, getEventsForMonth, NudgeEvent } from '../../utils/nudgeEvents';

interface MonthCalendarProps {
  selectedDateIso: string;
  onSelectDate: (iso: string) => void;
  tasks?: NudgeTask[];
  onMonthChange?: (year: number, month: number) => void;
  currentViewingYear: number;
  currentViewingMonth: number; // 0-based: 0 = Jan, 11 = Dec
  onNavigateMonth: (direction: -1 | 1) => void;
  onJumpToToday: () => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  selectedDateIso,
  onSelectDate,
  tasks = [],
  currentViewingYear,
  currentViewingMonth,
  onNavigateMonth,
  onJumpToToday,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatDateToIso(today), [today]);

  const monthName = useMemo(() => {
    const d = new Date(currentViewingYear, currentViewingMonth, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [currentViewingYear, currentViewingMonth]);

  // Compute days in month grid (Monday - Sunday)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentViewingYear, currentViewingMonth, 1);
    // Sunday is 0, Monday is 1, ... Saturday is 6
    // In ISO/European week, Monday is 0, Sunday is 6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInCurrentMonth = new Date(currentViewingYear, currentViewingMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentViewingYear, currentViewingMonth, 0).getDate();

    interface GridDay {
      iso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasTasks: boolean;
      events: NudgeEvent[];
    }

    const days: GridDay[] = [];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(currentViewingYear, currentViewingMonth - 1, dNum);
      const iso = formatDateToIso(prevDate);
      days.push({
        iso,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedDateIso,
        hasTasks: tasks.some((t) => doesTaskOccurOnDate(t, iso)),
        events: getEventsForDate(prevDate.getFullYear(), prevDate.getMonth() + 1, dNum),
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(currentViewingYear, currentViewingMonth, d);
      const iso = formatDateToIso(curDate);
      days.push({
        iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === selectedDateIso,
        hasTasks: tasks.some((t) => doesTaskOccurOnDate(t, iso)),
        events: getEventsForDate(currentViewingYear, currentViewingMonth + 1, d),
      });
    }

    // Trailing days to fill the complete row (multiple of 7)
    const remainder = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const nextDate = new Date(currentViewingYear, currentViewingMonth + 1, d);
      const iso = formatDateToIso(nextDate);
      days.push({
        iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedDateIso,
        hasTasks: tasks.some((t) => doesTaskOccurOnDate(t, iso)),
        events: getEventsForDate(nextDate.getFullYear(), nextDate.getMonth() + 1, d),
      });
    }

    return days;
  }, [currentViewingYear, currentViewingMonth, selectedDateIso, todayIso, tasks]);

  const weekDayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Events in this viewing month
  const monthEvents = useMemo(() => {
    return getEventsForMonth(currentViewingYear, currentViewingMonth + 1);
  }, [currentViewingYear, currentViewingMonth]);

  return (
    <div className="bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-4 shadow-xs">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-serif font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-tight">
          {monthName}
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onJumpToToday}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-nudge-blue bg-nudge-blue/10 hover:bg-nudge-blue hover:text-white transition-all"
            title="Jump to today"
          >
            Today
          </button>
          <div className="flex items-center">
            <button
              onClick={() => onNavigateMonth(-1)}
              className="p-1.5 rounded-lg text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateMonth(1)}
              className="p-1.5 rounded-lg text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1 text-center">
        {weekDayHeaders.map((day, idx) => (
          <div
            key={idx}
            className="py-1 text-[11px] font-semibold uppercase tracking-wider text-nudge-text-muted dark:text-nudge-text-muted-dark"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const hasEvent = day.events.length > 0;

          return (
            <button
              key={day.iso}
              onClick={() => onSelectDate(day.iso)}
              className={`relative flex flex-col items-center justify-center h-10 rounded-xl transition-all ${
                day.isSelected
                  ? 'bg-nudge-blue text-white shadow-xs font-semibold ring-2 ring-nudge-blue/20'
                  : day.isToday
                  ? 'bg-nudge-blue/10 text-nudge-blue font-semibold dark:bg-nudge-blue/20 dark:text-sky-300'
                  : day.isCurrentMonth
                  ? 'text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark'
                  : 'text-nudge-text-muted/40 dark:text-nudge-text-muted-dark/40 hover:bg-nudge-parchment/40'
              }`}
            >
              <span className="text-xs leading-none">{day.dayNumber}</span>

              {/* Indicator dots for tasks and events */}
              <div className="flex items-center gap-0.5 mt-1 h-1">
                {day.hasTasks && (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      day.isSelected ? 'bg-white' : 'bg-nudge-blue'
                    }`}
                  />
                )}
                {hasEvent && (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      day.isSelected ? 'bg-amber-200' : 'bg-amber-500'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Month Events Summary / Observances in Current Month */}
      {monthEvents.length > 0 && (
        <div className="mt-4 pt-3 border-t border-nudge-border dark:border-nudge-border-dark">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Observances & Events in {new Date(currentViewingYear, currentViewingMonth, 1).toLocaleString('en-US', { month: 'short' })}
            </span>
            <span className="text-[11px] font-medium text-nudge-text-muted dark:text-nudge-text-muted-dark">
              {monthEvents.length} events
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {monthEvents.map((evt) => {
              const evtDateIso = `${currentViewingYear}-${String(evt.month).padStart(2, '0')}-${String(evt.day).padStart(2, '0')}`;
              const isSelected = selectedDateIso === evtDateIso;
              return (
                <button
                  key={evt.id}
                  onClick={() => onSelectDate(evtDateIso)}
                  className={`shrink-0 text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'border-nudge-blue bg-nudge-blue/10 dark:bg-nudge-blue/20'
                      : 'border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/50 dark:bg-nudge-parchment-dark/50 hover:border-nudge-blue/50'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    {new Date(currentViewingYear, evt.month - 1, evt.day).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark truncate max-w-[130px]">
                    {evt.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
