import React, { useState, useRef } from 'react';
import { Search, Inbox, X, Send, Mic } from 'lucide-react';
import { NudgeTask } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { CreateTaskInput } from '../hooks/useNudgeTasks';
import { parseNudgeNlp } from '../utils/nlpParser';
import { isTaskCompletedOnDate, getTodayIso } from '../utils/recurrence';
import { matchesNoteSearch } from '../utils/taskSearch';

interface NotesPageProps {
  tasks: NudgeTask[];
  onToggleDone: (id: number, dateIso?: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<any>;
  onEditTask: (task: NudgeTask) => void;
  onDeleteTask: (id: number) => void;
  onSnoozeTask?: (id: number, snoozeType: '30m' | 'tonight' | 'tomorrow') => void;
  onOpenComposer?: () => void;
}

const getCategoryDotColor = (cat: string) => {
  switch (cat.toLowerCase()) {
    case 'home':
      return 'bg-[#2A7E35] dark:bg-[#A2E4AA]';
    case 'work':
      return 'bg-[#6B48B8] dark:bg-[#D2B3F9]';
    case 'shopping':
      return 'bg-[#D45512] dark:bg-[#FFAB78]';
    case 'personal':
      return 'bg-[#2E62F6] dark:bg-[#96B7FF]';
    default:
      return 'bg-nudge-text-muted';
  }
};

export const NotesPage: React.FC<NotesPageProps> = ({
  tasks,
  onToggleDone,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onSnoozeTask,
  onOpenComposer,
}) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('nudge_notes_search') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return sessionStorage.getItem('nudge_notes_category') || 'All';
  });
  const [quickNoteText, setQuickNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const todayIso = getTodayIso();

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
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQuickNoteText(transcript);
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

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val) {
      sessionStorage.setItem('nudge_notes_search', val);
    } else {
      sessionStorage.removeItem('nudge_notes_search');
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    sessionStorage.setItem('nudge_notes_category', cat);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    sessionStorage.removeItem('nudge_notes_search');
  };

  const categories = ['All', 'Personal', 'Work', 'Home', 'Shopping'];

  // Filter tasks based on Search query & selected category
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = searchQuery.trim() === '' || matchesNoteSearch(task, searchQuery);
    const matchesCat =
      selectedCategory === 'All' ||
      (task.category && task.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const activeNotes = filteredTasks.filter((t) => !isTaskCompletedOnDate(t, todayIso));
  const completedNotes = filteredTasks.filter((t) => isTaskCompletedOnDate(t, todayIso));

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickNoteText.trim();
    if (!raw || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const parsed = parseNudgeNlp(raw);

      await onCreateTask({
        title: parsed.cleanTitle || raw,
        dateLabel: parsed.extractedDate,
        startDate: parsed.startDateIso,
        timeLabel: parsed.extractedTime,
        category:
          selectedCategory !== 'All' ? selectedCategory : parsed.extractedCategory,
        priority: parsed.extractedPriority,
        repeat: parsed.extractedRepeat,
      });

      setQuickNoteText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300" data-testid="all_tasks_screen">
      {/* 1. Page Heading matching AllTasksScreen.kt */}
      <div className="pt-1 pb-1">
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
          Your notes,
        </h1>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
          always kept close.
        </h1>
      </div>

      {/* 2. Search Box matching AllTasksScreen.kt */}
      <div className="relative">
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-[14px] bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark focus-within:border-nudge-blue dark:focus-within:border-nudge-blue shadow-2xs transition-all">
          <Search className="w-5 h-5 text-nudge-text-secondary dark:text-nudge-text-secondary-dark mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search, find, and keep moving."
            className="flex-1 bg-transparent text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none"
            data-testid="search_tasks_input"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1 rounded-full text-nudge-text-muted hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="px-2 py-0.5 rounded-lg bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-blue dark:text-nudge-blue-light text-[11px] font-bold">
              {tasks.length}
            </span>
          )}
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-nudge-card-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border dark:border-nudge-border-dark hover:border-nudge-blue'
              }`}
            >
              {cat !== 'All' && (
                <span className={`w-1.5 h-1.5 rounded-full ${getCategoryDotColor(cat)}`} />
              )}
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. Quick Add Bar for Notes */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 p-1.5 rounded-[18px] bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs"
      >
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse'
              : 'text-nudge-blue hover:bg-nudge-blue/10 dark:hover:bg-nudge-blue/20'
          }`}
          title={isListening ? 'Listening…' : 'Speak note'}
          data-testid="notes_quick_capture_mic_button"
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          ref={quickInputRef}
          type="text"
          value={quickNoteText}
          onChange={(e) => setQuickNoteText(e.target.value)}
          placeholder="Add a thought to your notes…"
          disabled={isSubmitting}
          className="flex-1 px-2 py-1.5 text-sm bg-transparent text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickNoteText.trim() || isSubmitting}
          className="p-2 rounded-xl bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors disabled:opacity-40 cursor-pointer"
          title="Add note"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* 5. Tasks List matching AllTasksScreen.kt */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-nudge-card-dark rounded-[20px] border border-nudge-border dark:border-nudge-border-dark p-6 space-y-2 shadow-2xs">
          <p className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
            {searchQuery.trim()
              ? `No nudges found for "${searchQuery}".`
              : 'No notes yet.'}
          </p>
          <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
            Tap the + button below to write down a gentle thought.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ACTIVE SECTION */}
          {activeNotes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  ACTIVE
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-blue dark:text-nudge-blue-light border border-nudge-border/60 dark:border-nudge-border-dark/60">
                  {activeNotes.length} to do
                </span>
              </div>
              <div className="space-y-2">
                {activeNotes.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    occurrenceDateIso={todayIso}
                    onToggleDone={onToggleDone}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onSnooze={onSnoozeTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* COMPLETED SECTION */}
          {completedNotes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  COMPLETED
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60">
                  {completedNotes.length} done
                </span>
              </div>
              <div className="space-y-2">
                {completedNotes.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    occurrenceDateIso={todayIso}
                    onToggleDone={onToggleDone}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onSnooze={onSnoozeTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
