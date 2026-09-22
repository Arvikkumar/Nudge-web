import React, { useState } from 'react';
import { Search, Inbox, Plus, X, Send } from 'lucide-react';
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
  const todayIso = getTodayIso();

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
      <div className="flex items-start justify-between gap-4">
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

        {onOpenComposer && (
          <button
            onClick={onOpenComposer}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-nudge-blue text-white text-xs font-semibold hover:bg-nudge-blue-light transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </button>
        )}
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-nudge-card-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border dark:border-nudge-border-dark hover:bg-nudge-parchment dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
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

      {/* Quick Add Note Bar */}
      <section className="bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-2 shadow-xs">
        <form onSubmit={handleQuickAddNote} className="flex items-center gap-2">
          <input
            type="text"
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            placeholder={`Add a note to ${selectedCategory === 'All' ? 'Personal' : selectedCategory}…`}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-sm bg-transparent text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors disabled:opacity-40"
            disabled={!quickNoteText.trim() || isSubmitting}
            title="Save note"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* Notes Results or Empty State */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-6 space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-nudge-parchment dark:bg-zinc-800/80 mx-auto flex items-center justify-center text-nudge-text-muted">
            <Search className="w-5 h-5 stroke-[1.8]" />
          </div>
          <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
            No matching notes
          </p>
          <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark max-w-sm mx-auto">
            {searchQuery.trim()
              ? `We couldn't find any notes matching "${searchQuery.trim()}".`
              : `No notes found in ${selectedCategory}.`}
          </p>
          <div className="pt-1.5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleResetSearchAndCategory}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-nudge-parchment dark:bg-zinc-800 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-border/40 border border-nudge-border dark:border-nudge-border-dark transition-colors inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear search & filter</span>
            </button>
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
              <div className="text-center py-8 bg-white dark:bg-nudge-card-dark rounded-2xl border border-nudge-border dark:border-nudge-border-dark p-6">
                <Inbox className="w-7 h-7 mx-auto text-nudge-text-muted mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  No active notes found
                </p>
                <p className="text-xs text-nudge-text-muted mt-1">
                  All matching notes are completed or archived.
                </p>
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
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed / Archived Notes List */}
          {completedNotes.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase px-1">
                Completed / Archived ({completedNotes.length})
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
