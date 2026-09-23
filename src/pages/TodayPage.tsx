import React, { useState, useMemo, useRef } from 'react';
import { Send, Sparkles, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Mic } from 'lucide-react';
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

interface TodayPageProps {
  tasks: NudgeTask[];
  onToggleDone: (id: number, dateIso?: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<any>;
  onEditTask: (task: NudgeTask) => void;
  onDeleteTask: (id: number) => void;
  onSnoozeTask?: (id: number, snoozeType: '30m' | 'tonight' | 'tomorrow') => void;
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

  const [quickInput, setQuickInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
  // If selectedDate is within today-2 to today+4, display standard window
  // Otherwise, center the 7-day strip around selectedDate
  const dateStripDays = useMemo(() => {
    const todayMillis = today.getTime();
    const selMillis = selectedDate.getTime();
    const diffDays = Math.round((selMillis - todayMillis) / (1000 * 60 * 60 * 24));

    let startOffsetFromToday = -2;
    if (diffDays < -2 || diffDays > 4) {
      // Center around selected date
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

  // Live NLP preview
  const liveNlp = quickInput.trim().length > 3 ? parseNudgeNlp(quickInput) : null;
  const showLivePreview =
    liveNlp &&
    (liveNlp.hasExplicitDateTime ||
      liveNlp.extractedPriority === 'Important' ||
      liveNlp.extractedCategory !== 'Personal');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickInput.trim();
    if (!raw || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const parsed = parseNudgeNlp(raw);

      // Determine date and time labels
      let dateLabel = parsed.extractedDate;
      let startDateIso = parsed.startDateIso;

      // If user didn't mention an explicit date in NLP and is looking at a non-today date:
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
        title: parsed.cleanTitle || raw,
        dateLabel,
        startDate: startDateIso,
        timeLabel: parsed.extractedTime,
        category: parsed.extractedCategory,
        priority: parsed.extractedPriority,
        repeat: parsed.extractedRepeat,
      });
      setQuickInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
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
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQuickInput(transcript);
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
      return "Today's Gentle Nudges";
    }
    if (selectedDateIso === getOffsetIso(1)) {
      return "Tomorrow's Gentle Nudges";
    }
    if (selectedDateIso === getOffsetIso(-1)) {
      return "Yesterday's Gentle Nudges";
    }
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }, [selectedDateIso, todayIso, selectedDate, today]);

  const viewingMonthTitle = useMemo(() => {
    const d = new Date(viewingYear, viewingMonth, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [viewingYear, viewingMonth]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Parchment Banner */}
      <section className="relative overflow-hidden rounded-[24px] bg-nudge-parchment dark:bg-nudge-parchment-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 p-6 sm:p-7 shadow-xs">
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-nudge-cream dark:bg-nudge-card-dark opacity-60 pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="max-w-[76%] space-y-1">
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
              What deserves
            </h1>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
              your attention?
            </h1>
            <p className="text-xs sm:text-sm text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-1">
              A little reminder can go a long way.
            </p>
          </div>

          <button
            onClick={handleJumpToToday}
            title="Return to Today"
            className="w-[54px] h-[54px] rounded-full bg-nudge-blue text-white flex flex-col items-center justify-center shrink-0 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-[20px] font-bold leading-none">{dayNumber}</span>
            <span className="text-[9px] font-semibold tracking-wider opacity-90 mt-0.5 uppercase">
              {monthAbbr}
            </span>
          </button>
        </div>
      </section>

      {/* Date Navigation & Calendar Strip */}
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
        <div className="bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-1.5 sm:p-2 flex items-center justify-between shadow-2xs gap-0.5 sm:gap-1">
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

      {/* Quick Add Bar with Natural Language & Voice Support matching QuickCaptureBar.kt */}
      <section className="bg-white dark:bg-nudge-card-dark rounded-[18px] border border-nudge-border dark:border-nudge-border-dark p-2 shadow-xs space-y-1.5">
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          {/* LEFT: Microphone / voice recording button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse'
                : 'text-nudge-blue hover:bg-nudge-blue/10 dark:hover:bg-nudge-blue/20'
            }`}
            title={isListening ? 'Listening…' : 'Speak reminder'}
            data-testid="quick_capture_mic_button"
          >
            <Mic className="w-4 h-4 stroke-[2]" />
          </button>

          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Add a quick thought…"
            disabled={isSubmitting}
            className="flex-1 px-2 py-2 text-sm bg-transparent text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none"
            data-testid="quick_capture_input"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors disabled:opacity-40"
            disabled={!quickInput.trim() || isSubmitting}
            title="Add reminder"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Live NLP Preview Pill */}
        {showLivePreview && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-1 text-[11px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark border-t border-nudge-border/40 dark:border-nudge-border-dark/40 pt-1.5">
            <span className="flex items-center gap-1 text-nudge-blue font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Smart detection:</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark">
              🗓 {liveNlp.extractedDate}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark">
              ⏰ {liveNlp.extractedTime}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark">
              🏷 {liveNlp.extractedCategory}
            </span>
            {liveNlp.extractedPriority === 'Important' && (
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-semibold">
                🔥 Important
              </span>
            )}
            {liveNlp.extractedRepeat !== 'Does not repeat' && (
              <span className="px-2 py-0.5 rounded-md bg-nudge-blue/10 text-nudge-blue font-semibold">
                🔄 {liveNlp.extractedRepeat}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Important Dates / Observances for Selected Date */}
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

      {/* Gentle Nudges List matching TodayScreen.kt */}
      <section className="space-y-3">
        {/* Date-specific Header matching TodayScreen.kt */}
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark block">
              {selectedDateIso === todayIso ? "TODAY'S NUDGES" : headingDateText.toUpperCase()}
            </span>
            <h2 className="font-editorial-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              Keep these close
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-nudge-blue/10 text-nudge-blue dark:bg-nudge-blue/20 dark:text-nudge-blue-light">
            {activeTasks.length} active
          </span>
        </div>

        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-nudge-card-dark rounded-[18px] border border-nudge-border dark:border-nudge-border-dark p-6 space-y-1.5 shadow-2xs">
            <p className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
              Your day is quiet and clear.
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
