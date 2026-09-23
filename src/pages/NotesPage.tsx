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

  const handleResetSearchAndCategory = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    sessionStorage.removeItem('nudge_notes_search');
    sessionStorage.setItem('nudge_notes_category', 'All');
  };

  // Keep existing Notes categories intact
  const categories = ['All', 'Personal', 'Work', 'Home', 'Shopping'];

  // Improved Notes search across note title, note content, and category
  const filteredNotes = tasks.filter((item) =>
    matchesNoteSearch(item, searchQuery, selectedCategory, todayIso)
  );

  const activeNotes = filteredNotes.filter((n) => !isTaskCompletedOnDate(n, todayIso));
  const completedNotes = filteredNotes.filter((n) => isTaskCompletedOnDate(n, todayIso));

  const handleQuickAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickNoteText.trim();
    if (!raw || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const parsed = parseNudgeNlp(raw);
      const category =
        selectedCategory !== 'All' ? selectedCategory : parsed.extractedCategory;

      await onCreateTask({
        title: parsed.cleanTitle || raw,
        dateLabel: parsed.extractedDate || 'Today',
        startDate: parsed.startDateIso || todayIso,
        timeLabel: parsed.extractedTime || 'Any time',
        category,
        priority: parsed.extractedPriority || 'Normal',
        repeat: parsed.extractedRepeat || 'Does not repeat',
      });
      setQuickNoteText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with Editorial Title matching AllTasksScreen.kt */}
      <div className="space-y-1">
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
          Your notes,
        </h1>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
          always kept close.
        </h1>
        <p className="text-xs sm:text-sm text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-1">
          Everything you’ve tucked away for later, calm and organized.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nudge-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search all notes & nudges by keyword or topic…"
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted shadow-xs focus:outline-none focus:border-nudge-blue"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-nudge-text-muted hover:text-nudge-text-primary rounded-full transition-colors"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-nudge-card-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border dark:border-nudge-border-dark hover:bg-nudge-parchment dark:hover:bg-zinc-800'
              }`}
            >
              {cat !== 'All' && (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-white' : getCategoryDotColor(cat)
                  }`}
                />
              )}
              <span>{cat}</span>
            </button>
          );
        })}

        {(searchQuery || selectedCategory !== 'All') && (
          <button
            type="button"
            onClick={handleResetSearchAndCategory}
            className="text-[11px] font-medium text-nudge-text-muted hover:text-nudge-blue px-2 py-1 rounded-md transition-colors whitespace-nowrap ml-1 underline decoration-dotted"
            title="Reset all filters"
          >
            Reset
          </button>
        )}
      </div>

      {/* Quick Add Note Bar with Voice Input */}
      <section className="bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-2 shadow-xs">
        <form onSubmit={handleQuickAddNote} className="flex items-center gap-1.5 sm:gap-2">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2 rounded-xl transition-all shrink-0 ${
              isListening
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse'
                : 'text-nudge-blue hover:bg-nudge-blue/10 dark:hover:bg-nudge-blue/20'
            }`}
            title={isListening ? 'Listening…' : 'Speak note'}
            aria-label={isListening ? 'Stop listening' : 'Record voice note'}
            data-testid="notes_quick_capture_mic_button"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            ref={quickInputRef}
            type="text"
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            placeholder={
              selectedCategory === 'All'
                ? 'Keep a note close…'
                : `Keep a note in ${selectedCategory}…`
            }
            disabled={isSubmitting}
            className="flex-1 px-2.5 py-2 text-sm bg-transparent text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none min-w-0"
          />

          <button
            type="submit"
            className="p-2 rounded-xl bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors disabled:opacity-40 shrink-0"
            disabled={!quickNoteText.trim() || isSubmitting}
            title="Save note"
            aria-label="Save note"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* Notes Results or Empty State */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-6 space-y-3">
          <div className="w-10 h-10 rounded-full bg-nudge-parchment dark:bg-zinc-800/80 mx-auto flex items-center justify-center text-nudge-text-muted">
            <Search className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
              {searchQuery.trim()
                ? 'No matching notes'
                : selectedCategory === 'All'
                ? 'No notes yet'
                : `No notes in ${selectedCategory}`}
            </p>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark max-w-sm mx-auto">
              {searchQuery.trim()
                ? `We couldn't find any notes matching "${searchQuery.trim()}".`
                : 'Keep ideas, reminders, and thoughts tucked away calmly for later.'}
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            {searchQuery.trim() || selectedCategory !== 'All' ? (
              <button
                type="button"
                onClick={handleResetSearchAndCategory}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-nudge-parchment dark:bg-zinc-800 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-border/40 border border-nudge-border dark:border-nudge-border-dark transition-colors inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear search & filter</span>
              </button>
            ) : null}
            {!searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  quickInputRef.current?.focus();
                  quickInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors shadow-xs"
              >
                Add a thought
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Active Notes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase">
                Active Notes ({activeNotes.length})
              </h2>
            </div>

            {activeNotes.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-6 space-y-2">
                <Inbox className="w-7 h-7 mx-auto text-nudge-text-muted mb-1 stroke-[1.5]" />
                <p className="text-sm font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  No active notes found
                </p>
                <p className="text-xs text-nudge-text-muted max-w-xs mx-auto">
                  All matching notes are completed or archived.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      quickInputRef.current?.focus();
                      quickInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-nudge-blue/10 hover:bg-nudge-blue/20 text-nudge-blue dark:bg-nudge-blue/20 dark:text-nudge-blue-light transition-colors"
                  >
                    Add a thought
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeNotes.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    occurrenceDateIso={todayIso}
                    onToggleDone={onToggleDone}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onSnooze={onSnoozeTask}
                    isNoteContext
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed / Archived Notes List */}
          {completedNotes.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
                Archived Notes ({completedNotes.length})
              </h2>
              <div className="space-y-2.5">
                {completedNotes.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    occurrenceDateIso={todayIso}
                    onToggleDone={onToggleDone}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onSnooze={onSnoozeTask}
                    isNoteContext
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
