import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Clock,
  Calendar,
  Tag,
  AlertCircle,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { NudgeTask, TaskPriority } from '../../types';
import { parseNudgeNlp, formatClockTime } from '../../utils/nlpParser';
import { getTodayIso, getOffsetIso } from '../../utils/recurrence';
import { parseTimeLabel } from '../../utils/reminderScheduler';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: NudgeTask | null;
  initialDateLabel?: string;
  onSave: (data: {
    title: string;
    timeLabel: string;
    dateLabel: string;
    startDate?: string;
    category: string;
    priority: TaskPriority;
    repeat: string;
  }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDateLabel = 'Today',
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [timeLabel, setTimeLabel] = useState('Any time');
  const [dateLabel, setDateLabel] = useState(initialDateLabel);
  const [startDateIso, setStartDateIso] = useState(getTodayIso());
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [repeat, setRepeat] = useState('Does not repeat');
  const [isSaving, setIsSaving] = useState(false);

  // Custom picker modes
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customDateValue, setCustomDateValue] = useState(getTodayIso());
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState('09:00');

  const categories = ['Personal', 'Work', 'Home', 'Shopping', 'Other'];
  const standardDateOptions = ['Today', 'Tomorrow', 'This Week', 'Next Week'];
  const standardTimeOptions = ['Any time', 'Morning (9:00 AM)', '2:30 PM', '5:00 PM', 'Tonight (8:00 PM)'];
  const repeatOptions = [
    'Does not repeat',
    'Every day',
    'Every 2 days',
    'Weekdays',
    'Every week',
    'Every month',
  ];

  // NLP Live Preview Suggestion
  const nlpPreview = title.trim().length > 3 ? parseNudgeNlp(title) : null;
  const showNlpSuggestion =
    nlpPreview &&
    nlpPreview.hasExplicitDateTime &&
    nlpPreview.cleanTitle !== title.trim();

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setTimeLabel(taskToEdit.timeLabel);
      setDateLabel(taskToEdit.dateLabel);
      setStartDateIso(taskToEdit.startDate || getTodayIso());
      setCategory(taskToEdit.category || 'Personal');
      setPriority(taskToEdit.priority || 'Normal');
      setRepeat(taskToEdit.repeat || 'Does not repeat');

      const isStdDate = standardDateOptions.includes(taskToEdit.dateLabel);
      setIsCustomDate(!isStdDate);
      if (!isStdDate) setCustomDateValue(taskToEdit.startDate || getTodayIso());

      const isStdTime =
        standardTimeOptions.includes(taskToEdit.timeLabel) ||
        taskToEdit.timeLabel === '9:00 AM' ||
        taskToEdit.timeLabel === '8:00 PM';
      const isCustom = !isStdTime && taskToEdit.timeLabel !== 'Any time';
      setIsCustomTime(isCustom);
      if (isCustom) {
        const parsed = parseTimeLabel(taskToEdit.timeLabel);
        if (parsed) {
          const pad = (n: number) => String(n).padStart(2, '0');
          setCustomTimeValue(`${pad(parsed.hour)}:${pad(parsed.minute)}`);
        }
      }
    } else {
      setTitle('');
      setTimeLabel('Any time');
      setDateLabel(initialDateLabel);
      setStartDateIso(initialDateLabel === 'Tomorrow' ? getOffsetIso(1) : getTodayIso());
      setCategory('Personal');
      setPriority('Normal');
      setRepeat('Does not repeat');
      setIsCustomDate(false);
      setIsCustomTime(false);
    }
  }, [taskToEdit, initialDateLabel, isOpen]);

  if (!isOpen) return null;

  const handleApplyNlpSuggestion = () => {
    if (!nlpPreview) return;
    setTitle(nlpPreview.cleanTitle);
    setDateLabel(nlpPreview.extractedDate);
    setTimeLabel(nlpPreview.extractedTime);
    setCategory(nlpPreview.extractedCategory);
    setPriority(nlpPreview.extractedPriority);
    setStartDateIso(nlpPreview.startDateIso);
    if (nlpPreview.extractedRepeat !== 'Does not repeat') {
      setRepeat(nlpPreview.extractedRepeat);
    }
  };

  const handleSelectDate = (d: string) => {
    setIsCustomDate(false);
    setDateLabel(d);
    if (d === 'Today') setStartDateIso(getTodayIso());
    else if (d === 'Tomorrow') setStartDateIso(getOffsetIso(1));
    else if (d === 'This Week') setStartDateIso(getTodayIso());
    else if (d === 'Next Week') setStartDateIso(getOffsetIso(7));
  };

  const handleCustomDateChange = (iso: string) => {
    setCustomDateValue(iso);
    setStartDateIso(iso);
    setDateLabel(iso);
  };

  const handleSelectTime = (t: string) => {
    setIsCustomTime(false);
    if (t === 'Morning (9:00 AM)') setTimeLabel('9:00 AM');
    else if (t === 'Tonight (8:00 PM)') setTimeLabel('8:00 PM');
    else setTimeLabel(t);
  };

  const handleCustomTimeChange = (time24: string) => {
    setCustomTimeValue(time24);
    if (!time24) return;
    const [h, m] = time24.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    setTimeLabel(formatClockTime(d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      await onSave({
        title: title.trim(),
        timeLabel,
        dateLabel,
        startDate: startDateIso,
        category,
        priority,
        repeat,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (taskToEdit && onDelete) {
      await onDelete(taskToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark shadow-float p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-nudge-border/50 dark:border-nudge-border-dark/50">
          <h3 className="font-serif text-xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
            {taskToEdit ? 'Edit Gentle Nudge' : 'New Gentle Nudge'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-nudge-text-muted hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Reminder
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pay electricity bill tomorrow 7pm"
              className="w-full px-4 py-2.5 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none focus:border-nudge-blue"
              autoFocus
              required
            />

            {/* Smart NLP Suggestion Pill */}
            {showNlpSuggestion && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-nudge-blue/10 border border-nudge-blue/20 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-nudge-blue min-w-0 truncate">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Recognized: <b>{nlpPreview.extractedDate}</b> at <b>{nlpPreview.extractedTime}</b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyNlpSuggestion}
                  className="px-2.5 py-1 rounded-lg bg-nudge-blue text-white text-[11px] font-semibold hover:bg-nudge-blue-light transition-colors shrink-0 ml-2"
                >
                  Auto-fill
                </button>
              </div>
            )}
          </div>

          {/* Date Selector (Chips + Custom Calendar Date) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark flex items-center justify-between">
              <span>Date</span>
              <span className="text-[11px] font-normal text-nudge-text-muted">{dateLabel}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {standardDateOptions.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleSelectDate(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    !isCustomDate && dateLabel === d
                      ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                      : 'bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary'
                  }`}
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomDate(true)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  isCustomDate
                    ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                    : 'bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Calendar…</span>
              </button>
            </div>

            {isCustomDate && (
              <div className="pt-1.5">
                <input
                  type="date"
                  value={customDateValue}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>
            )}
          </div>

          {/* Time Selector (Chips + Custom Time Picker) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark flex items-center justify-between">
              <span>Time</span>
              <span className="text-[11px] font-normal text-nudge-text-muted">{timeLabel}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {standardTimeOptions.map((t) => {
                const label = t.split(' ')[0];
                const isSelected =
                  !isCustomTime &&
                  (timeLabel === t ||
                    (t === 'Morning (9:00 AM)' && timeLabel === '9:00 AM') ||
                    (t === 'Tonight (8:00 PM)' && timeLabel === '8:00 PM'));
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => handleSelectTime(t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                        : 'bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomTime(true)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  isCustomTime
                    ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                    : 'bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Custom…</span>
              </button>
            </div>

            {isCustomTime && (
              <div className="pt-1.5">
                <input
                  type="time"
                  value={customTimeValue}
                  onChange={(e) => handleCustomTimeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>
            )}
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                      : 'bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark flex items-center gap-1">
              <Repeat className="w-3 h-3 text-nudge-blue" />
              <span>Repeat</span>
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
            >
              {repeatOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Priority
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPriority('Normal')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                  priority === 'Normal'
                    ? 'bg-nudge-parchment dark:bg-nudge-parchment-dark border-nudge-blue text-nudge-blue font-semibold'
                    : 'border-nudge-border dark:border-nudge-border-dark text-nudge-text-secondary hover:text-nudge-text-primary'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('Important')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                  priority === 'Important'
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 font-semibold'
                    : 'border-nudge-border dark:border-nudge-border-dark text-nudge-text-secondary hover:text-nudge-text-primary'
                }`}
              >
                Important
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-nudge-border/50 dark:border-nudge-border-dark/50">
            {taskToEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete nudge"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-nudge-blue hover:bg-nudge-blue-light text-white shadow-xs transition-colors disabled:opacity-40"
              >
                {isSaving ? 'Saving…' : taskToEdit ? 'Save Changes' : 'Add Nudge'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
