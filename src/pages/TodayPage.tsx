import React, { useState, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { NudgeTask } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { CreateTaskInput } from '../hooks/useNudgeTasks';
import { parseNudgeNlp } from '../utils/nlpParser';
import {
  formatDateToIso,
  parseIsoToDate,
  doesTaskOccurOnDate,
  isTaskCompletedOnDate,
  getOffsetIso,
  getTodayIso,
} from '../utils/recurrence';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { EventCard } from '../components/calendar/EventCard';
import { getEventsForDate, hasEventOnDate } from '../utils/nudgeEvents';
import { DeepDiveState } from '../utils/deepDive';
import { QuickCaptureBar } from '../components/common/QuickCaptureBar';

interface TodayPageProps {
  tasks: NudgeTask[];
  onToggleDone: (id: number, dateIso?: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<any>;
  onEditTask: (task: NudgeTask) => void;
  onDeleteTask: (id: number) => void;
  onSnoozeTask?: (id: number, snoozeType: '30m' | 'tonight' | 'tomorrow') => void;
  onOpenComposer?: (draftText?: string, dateLabel?: string) => void;
  deepDiveState?: DeepDiveState;
  onOpenDeepDiveConfig?: () => void;
  onOpenDeepDiveActive?: () => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  tasks,
  onToggleDone,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onSnoozeTask,
  onOpenComposer,
  deepDiveState,
  onOpenDeepDiveConfig,
  onOpenDeepDiveActive,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatDateToIso(today), [today]);
  const dayNumber = today.getDate();
  const monthAbbr = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();

  // Selected date ISO (defaults to today)
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);

  // Viewing month in the calendar (year and 0-based month)
  const [viewingYear, setViewingYear] = useState<number>(today.getFullYear());
  const [viewingMonth, setViewingMonth] = useState<number>(today.getMonth());

  // Toggle for full month calendar view
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Selected date object
  const selectedDate = useMemo(() => parseIsoToDate(selectedDateIso), [selectedDateIso]);

  // Navigate viewing month
  const handleNavigateMonth = (direction: -1 | 1) => {
    let nextMonth = viewingMonth + direction;
    let nextYear = viewingYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setViewingMonth(nextMonth);
    setViewingYear(nextYear);
  };

  // Jump to today
  const handleJumpToToday = () => {
    setSelectedDateIso(todayIso);
    setViewingYear(today.getFullYear());
    setViewingMonth(today.getMonth());
  };

  // Select a specific date (from strip or calendar)
  const handleSelectDate = (iso: string) => {
    setSelectedDateIso(iso);
    const d = parseIsoToDate(iso);
    setViewingYear(d.getFullYear());
    setViewingMonth(d.getMonth());
  };

  // Generate 7-day date strip
  const dateStripDays = useMemo(() => {
    const todayMillis = today.getTime();
    const selMillis = selectedDate.getTime();
    const diffDays = Math.round((selMillis - todayMillis) / (1000 * 60 * 60 * 24));

    let startOffsetFromToday = -2;
    if (diffDays < -2 || diffDays > 4) {
      startOffsetFromToday = diffDays - 3;
    }

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + startOffsetFromToday + i);
      const iso = formatDateToIso(d);
      const dayTasks = tasks.filter((t) => doesTaskOccurOnDate(t, iso));
      const hasEvents = hasEventOnDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

      return {
        dayName: d.toLocaleString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isoDate: iso,
        isToday: iso === todayIso,
        isSelected: iso === selectedDateIso,
        hasTasks: dayTasks.length > 0,
        hasEvents,
      };
    });
  }, [today, selectedDate, selectedDateIso, todayIso, tasks]);

  // Events for selected date
  const eventsForSelectedDate = useMemo(() => {
    return getEventsForDate(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate()
    );
  }, [selectedDate]);

  // Tasks that occur on the selected date
  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter((task) => doesTaskOccurOnDate(task, selectedDateIso));
  }, [tasks, selectedDateIso]);

  const activeTasks = useMemo(() => {
    return tasksForSelectedDate.filter((t) => !isTaskCompletedOnDate(t, selectedDateIso));
  }, [tasksForSelectedDate, selectedDateIso]);

  const completedTasks = useMemo(() => {
    return tasksForSelectedDate.filter((t) => isTaskCompletedOnDate(t, selectedDateIso));
  }, [tasksForSelectedDate, selectedDateIso]);

  // Handle Quick Add from QuickCaptureBar
  const handleQuickAdd = async (rawTitle: string) => {
    const trimmed = rawTitle.trim();
    if (!trimmed) return;

    const parsed = parseNudgeNlp(trimmed);

    let dateLabel = parsed.extractedDate;
    let startDateIso = parsed.startDateIso;

    if (!parsed.hasExplicitDateTime && selectedDateIso !== todayIso) {
      if (selectedDateIso === getOffsetIso(1)) {
        dateLabel = 'Tomorrow';
        startDateIso = selectedDateIso;
      } else {
        dateLabel = selectedDateIso;
        startDateIso = selectedDateIso;
      }
    }

    await onCreateTask({
      title: parsed.cleanTitle || trimmed,
      dateLabel,
      startDate: startDateIso,
      timeLabel: parsed.extractedTime,
      category: parsed.extractedCategory,
      priority: parsed.extractedPriority,
      repeat: parsed.extractedRepeat,
    });
  };

  // Voice speech recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleQuickAdd(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Heading text
  const headingDateText = useMemo(() => {
    if (selectedDateIso === todayIso) {
      return "TODAY'S NUDGES";
    }
    if (selectedDateIso === getOffsetIso(1)) {
      return "TOMORROW'S NUDGES";
    }
    if (selectedDateIso === getOffsetIso(-1)) {
      return "YESTERDAY'S NUDGES";
    }
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).toUpperCase() + " NUDGES";
  }, [selectedDateIso, todayIso, selectedDate]);

  const viewingMonthTitle = useMemo(() => {
    const d = new Date(viewingYear, viewingMonth, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [viewingYear, viewingMonth]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300" data-testid="today_screen_list">
      {/* 1. Hero Parchment Banner matching TodayScreen.kt */}
      <section
        className="relative overflow-hidden rounded-[24px] bg-nudge-parchment dark:bg-nudge-parchment-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 p-5 sm:p-6 shadow-xs"
        data-testid="today_hero_card"
      >
        <div className="relative flex items-start justify-between gap-4">
          <div className="max-w-[76%] space-y-1">
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
              What deserves
            </h1>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
              your attention?
            </h1>
            <p className="text-xs sm:text-[13.5px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-1 leading-relaxed">
              A little reminder can go a long way.
            </p>
          </div>

          <button
            onClick={handleJumpToToday}
            title="Return to Today"
            className="w-[54px] h-[54px] rounded-full bg-nudge-blue text-white flex flex-col items-center justify-center shrink-0 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            data-testid="today_screen_date_badge"
          >
            <span className="text-[20px] font-bold leading-none">{dayNumber}</span>
            <span className="text-[9px] font-semibold tracking-wider opacity-90 mt-0.5 uppercase">
              {monthAbbr}
            </span>
          </button>
        </div>
      </section>

      {/* 2. Date Navigation & Calendar Strip */}
      <section className="space-y-2">
        {/* Month Navigation & Calendar Controls Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-nudge-text-primary dark:text-nudge-text-primary-dark truncate">
              {viewingMonthTitle}
            </h2>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => handleNavigateMonth(-1)}
                className="p-1 rounded-lg text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNavigateMonth(1)}
                className="p-1 rounded-lg text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {selectedDateIso !== todayIso && (
              <button
                onClick={handleJumpToToday}
                className="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-nudge-blue bg-nudge-blue/10 hover:bg-nudge-blue hover:text-white transition-all shrink-0"
              >
                Today
              </button>
            )}

            <button
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              aria-label={isCalendarOpen ? 'Hide calendar view' : 'Open month calendar view'}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isCalendarOpen
                  ? 'bg-nudge-blue text-white border-nudge-blue shadow-xs'
                  : 'bg-white dark:bg-nudge-card-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border-nudge-border dark:border-nudge-border-dark hover:border-nudge-blue'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCalendarOpen ? 'Hide Calendar' : 'Month View'}</span>
              <span className="sm:hidden">{isCalendarOpen ? 'Hide' : 'Month'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Month Calendar */}
        {isCalendarOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <MonthCalendar
              selectedDateIso={selectedDateIso}
              onSelectDate={handleSelectDate}
              tasks={tasks}
              currentViewingYear={viewingYear}
              currentViewingMonth={viewingMonth}
              onNavigateMonth={handleNavigateMonth}
              onJumpToToday={handleJumpToToday}
            />
          </div>
        )}

        {/* 7-Day Date Strip Component */}
        <div
          className="bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-1.5 sm:p-2 flex items-center justify-between shadow-2xs gap-0.5 sm:gap-1"
          data-testid="date_strip"
        >
          {dateStripDays.map((item) => {
            return (
              <button
                key={item.isoDate}
                onClick={() => handleSelectDate(item.isoDate)}
                className={`flex-1 py-1.5 sm:py-2 px-0.5 rounded-xl flex flex-col items-center transition-all min-w-0 ${
                  item.isSelected
                    ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                    : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark'
                }`}
                title={item.isToday ? 'Today' : item.isoDate}
              >
                <span
                  className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-tight sm:tracking-wider truncate w-full text-center ${
                    item.isSelected
                      ? 'text-white/85'
                      : 'text-nudge-text-muted dark:text-nudge-text-muted-dark'
                  }`}
                >
                  {item.dayName}
                </span>
                <span className="text-xs sm:text-sm font-semibold mt-0.5">{item.dayNum}</span>

                {/* Dot indicator for today, events, or tasks */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                  {item.isToday && !item.isSelected && (
                    <span className="w-1 h-1 rounded-full bg-nudge-blue" />
                  )}
                  {item.hasEvents && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        item.isSelected ? 'bg-amber-200' : 'bg-amber-500'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Single Quick Capture Bar matching Android QuickCaptureBar.kt */}
      <QuickCaptureBar
        onOpenComposer={(draft) => {
          if (onOpenComposer) {
            onOpenComposer(draft, selectedDateIso === todayIso ? 'Today' : selectedDateIso);
          }
        }}
        onQuickAdd={handleQuickAdd}
        onStartVoice={handleToggleVoice}
        isListening={isListening}
      />

      {/* 4. Observances & Celebrations for Selected Date (if any) */}
      {eventsForSelectedDate.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-semibold tracking-wider uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Observance & Celebration
            </h2>
          </div>
          <div className="space-y-2">
            {eventsForSelectedDate.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                formattedDateStr={selectedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Reminders Section matching TodayScreen.kt */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div>
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark block">
              {headingDateText}
            </span>
            <h2 className="font-editorial-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              Keep these close
            </h2>
          </div>
          {activeTasks.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-blue dark:text-nudge-blue-light border border-nudge-border/60 dark:border-nudge-border-dark/60">
              {activeTasks.length} to do
            </span>
          )}
        </div>

        {/* Reminders List or Empty State */}
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-nudge-card-dark rounded-[20px] border border-nudge-border dark:border-nudge-border-dark p-6 space-y-1.5 shadow-2xs">
            <p className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
              Nothing to remember right now.
            </p>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Take a breath, or write down a gentle thought.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                occurrenceDateIso={selectedDateIso}
                onToggleDone={onToggleDone}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onSnooze={onSnoozeTask}
              />
            ))}

            {completedTasks.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs font-medium text-nudge-text-muted dark:text-nudge-text-muted-dark px-1">
                  Completed for this day ({completedTasks.length})
                </span>
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    occurrenceDateIso={selectedDateIso}
                    onToggleDone={onToggleDone}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onSnooze={onSnoozeTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
