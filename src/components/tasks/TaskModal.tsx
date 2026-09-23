import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Check,
  Mic,
  Volume2,
  Repeat as RepeatIcon,
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
  const [soundType, setSoundType] = useState('Small nudge');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Custom picker modes
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customDateValue, setCustomDateValue] = useState(getTodayIso());
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState('09:00');
  const [isCustomRepeat, setIsCustomRepeat] = useState(false);
  const [customRepeatValue, setCustomRepeatValue] = useState('Every 2 weeks');

  // Voice speech recognition
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['Personal', 'Work', 'Home', 'Shopping', 'Other'];
  const standardDateOptions = ['Today', 'Tomorrow', 'This Week', 'Next Week'];
  const standardTimeOptions = [
    'Any time',
    'Morning (9:00 AM)',
    '2:30 PM',
    '5:00 PM',
    'Tonight (8:00 PM)',
  ];
  const standardRepeatOptions = [
    'Does not repeat',
    'Every day',
    'Weekdays',
    'Every week',
    'Every month',
  ];
  const customRepeatPresets = [
    'Every 2 days',
    'Every 2 weeks',
    'Every 3 months',
    'Every 6 months',
    'Every year',
  ];
  const soundOptions = ['Small nudge', 'Full ringtone'];

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
      setValidationError(null);

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

      const isStdRepeat = standardRepeatOptions.includes(taskToEdit.repeat || 'Does not repeat');
      setIsCustomRepeat(!isStdRepeat);
      if (!isStdRepeat) {
        setCustomRepeatValue(taskToEdit.repeat || 'Every 2 weeks');
      }
    } else {
      setTitle('');
      setTimeLabel('Any time');
      setDateLabel(initialDateLabel);
      setStartDateIso(initialDateLabel === 'Tomorrow' ? getOffsetIso(1) : getTodayIso());
      setCategory('Personal');
      setPriority('Normal');
      setRepeat('Does not repeat');
      setSoundType('Small nudge');
      setIsCustomDate(false);
      setIsCustomTime(false);
      setIsCustomRepeat(false);
      setValidationError(null);
    }
  }, [taskToEdit, initialDateLabel, isOpen]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up voice recognition on unmount / close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser.');
      setTimeout(() => setVoiceError(null), 4000);
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
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setTitle(transcript);
          setValidationError(null);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setVoiceError('Voice input error: ' + (event.error || 'unknown'));
          setTimeout(() => setVoiceError(null), 4000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceError('Could not start microphone.');
      setIsListening(false);
    }
  };

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
      const isStd = standardRepeatOptions.includes(nlpPreview.extractedRepeat);
      setIsCustomRepeat(!isStd);
      if (!isStd) setCustomRepeatValue(nlpPreview.extractedRepeat);
    }
  };

  const handleSelectDate = (d: string) => {
    setIsCustomDate(false);
    setDateLabel(d);
    setValidationError(null);
    if (d === 'Today') setStartDateIso(getTodayIso());
    else if (d === 'Tomorrow') setStartDateIso(getOffsetIso(1));
    else if (d === 'This Week') setStartDateIso(getTodayIso());
    else if (d === 'Next Week') setStartDateIso(getOffsetIso(7));
  };

  const handleCustomDateChange = (iso: string) => {
    setCustomDateValue(iso);
    setStartDateIso(iso);
    setDateLabel(iso);
    setValidationError(null);
  };

  const handleSelectTime = (t: string) => {
    setIsCustomTime(false);
    setValidationError(null);
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
    setValidationError(null);
  };

  const handleSelectRepeat = (rep: string) => {
    setIsCustomRepeat(false);
    setRepeat(rep);
  };

  const handleCustomRepeatChange = (customRep: string) => {
    setCustomRepeatValue(customRep);
    setRepeat(customRep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Give this little nudge a few words first.');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        title: trimmedTitle,
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-nudge-card-dark rounded-t-[28px] sm:rounded-card border-t border-x sm:border-b border-nudge-border/80 dark:border-nudge-border-dark shadow-float flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-300 ease-out overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android ModalBottomSheet Drag Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 rounded-full bg-nudge-border dark:bg-nudge-border-dark" />
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-3 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-nudge-blue dark:text-blue-400 uppercase block mb-0.5">
              {taskToEdit ? 'EDIT LITTLE NUDGE' : 'NEW LITTLE NUDGE'}
            </span>
            <h2 className="font-editorial-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
              {taskToEdit ? 'Refine this thought.' : 'Hold this thought.'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-nudge-text-muted hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
            aria-label="Close composer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body: Scrollable Content + Sticky Action Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 no-scrollbar">
            {/* Title & Quick Voice Capture */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="What would you like to remember?"
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-sm sm:text-base text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none focus:border-nudge-blue transition-colors"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-nudge-blue text-white animate-pulse'
                      : 'text-nudge-blue dark:text-blue-400 hover:bg-nudge-blue/10 dark:hover:bg-blue-900/30'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voice Listening indicator */}
            {isListening && (
              <div className="flex items-center gap-2 text-xs font-medium text-nudge-blue dark:text-blue-400 pl-1 pt-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-nudge-blue animate-ping" />
                <span>Listening… speak naturally (e.g. &ldquo;Read tonight at 9 PM&rdquo;)</span>
              </div>
            )}

            {/* Voice Error notice */}
            {voiceError && (
              <div className="text-xs text-rose-500 dark:text-rose-400 pl-1 pt-1">
                {voiceError}
              </div>
            )}

            {/* Smart NLP Suggestion Pill */}
            {showNlpSuggestion && (
              <div
                onClick={handleApplyNlpSuggestion}
                className="flex items-center justify-between p-2.5 rounded-card bg-nudge-blue/10 dark:bg-nudge-blue/20 border border-nudge-blue/25 text-xs cursor-pointer hover:bg-nudge-blue/15 transition-colors"
                data-testid="nlp-suggestion-chip"
              >
                <div className="flex items-center gap-2 text-nudge-blue dark:text-blue-300 min-w-0 truncate">
                  <Clock className="w-4 h-4 shrink-0 text-nudge-blue dark:text-blue-400" />
                  <span className="truncate">
                    Interpreted as <b>{nlpPreview.extractedDate}</b> at <b>{nlpPreview.extractedTime}</b>
                  </span>
                </div>
                <span className="text-[11.5px] font-bold text-nudge-blue dark:text-blue-400 shrink-0 ml-2">
                  Tap to apply
                </span>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                      : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* When / Date Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                When?
              </label>
              <span className="text-[11px] font-normal text-nudge-text-muted">{dateLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {standardDateOptions.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleSelectDate(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    !isCustomDate && dateLabel === d
                      ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                      : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                  }`}
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomDate(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isCustomDate
                    ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                    : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isCustomDate ? customDateValue : 'Custom date'}</span>
              </button>
            </div>

            {isCustomDate && (
              <div className="pt-1">
                <input
                  type="date"
                  value={customDateValue}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>
            )}
          </div>

          {/* At what time? / Time Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                At what time?
              </label>
              <span className="text-[11px] font-normal text-nudge-text-muted">{timeLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {standardTimeOptions.map((t) => {
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                        : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomTime(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isCustomTime
                    ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                    : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isCustomTime ? timeLabel : 'Custom time'}</span>
              </button>
            </div>

            {isCustomTime && (
              <div className="pt-1">
                <input
                  type="time"
                  value={customTimeValue}
                  onChange={(e) => handleCustomTimeChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>
            )}
          </div>

          {/* Repeat Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark flex items-center gap-1.5">
                <RepeatIcon className="w-3.5 h-3.5 text-nudge-blue" />
                <span>Repeat</span>
              </label>
              <span className="text-[11px] font-normal text-nudge-text-muted">{repeat}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {standardRepeatOptions.map((rep) => {
                const isSelected = !isCustomRepeat && repeat === rep;
                return (
                  <button
                    type="button"
                    key={rep}
                    onClick={() => handleSelectRepeat(rep)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                        : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                    }`}
                  >
                    {rep === 'Does not repeat' ? 'Once' : rep}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setIsCustomRepeat(true);
                  if (repeat === 'Does not repeat' || standardRepeatOptions.includes(repeat)) {
                    setRepeat(customRepeatValue);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isCustomRepeat
                    ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                    : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                }`}
              >
                {isCustomRepeat ? repeat : 'Custom…'}
              </button>
            </div>

            {isCustomRepeat && (
              <div className="pt-1">
                <select
                  value={repeat}
                  onChange={(e) => handleCustomRepeatChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border dark:border-nudge-border-dark text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                >
                  {customRepeatPresets.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reminder Sound Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-nudge-blue" />
              <span>Reminder Sound</span>
            </label>
            <div className="flex gap-2">
              {soundOptions.map((sound) => {
                const isSelected = soundType === sound;
                return (
                  <button
                    type="button"
                    key={sound}
                    onClick={() => setSoundType(sound)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-nudge-blue/15 text-nudge-blue dark:text-blue-400 border border-nudge-blue font-semibold'
                        : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 hover:text-nudge-text-primary'
                    }`}
                  >
                    {sound}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Important Priority Toggle Pill - Matching Android ComposerSheet */}
          <div
            onClick={() => setPriority(priority === 'Important' ? 'Normal' : 'Important')}
            className={`w-full p-3 rounded-card border cursor-pointer transition-colors flex items-center gap-2.5 ${
              priority === 'Important'
                ? 'bg-[#FFF3E8] dark:bg-[#3D2619] border-[#FF6B35]'
                : 'bg-nudge-parchment/50 dark:bg-nudge-parchment-dark/50 border-nudge-border dark:border-nudge-border-dark'
            }`}
            data-testid="composer-priority-toggle"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                priority === 'Important' ? 'bg-[#FF6B35]' : 'bg-neutral-400 dark:bg-neutral-500'
              }`}
            />
            <span
              className={`text-sm ${
                priority === 'Important'
                  ? 'font-semibold text-[#B33600] dark:text-[#FFA07A]'
                  : 'font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark'
              }`}
            >
              {priority === 'Important' ? 'Marked as Important' : 'Mark as Important'}
            </span>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-1">
              {validationError}
            </div>
          )}
          </div>

          {/* Sticky Action Footer */}
          <div className="shrink-0 px-6 py-3.5 bg-white dark:bg-nudge-card-dark border-t border-nudge-border/80 dark:border-nudge-border-dark/80 flex items-center justify-between gap-3 shadow-xs">
            {taskToEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                title="Delete nudge"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-nudge-text-muted min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-nudge-blue shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">Saved privately on device</span>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-nudge-blue hover:bg-nudge-blue-light text-white shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <span>{isSaving ? 'Saving…' : taskToEdit ? 'Update nudge' : 'Save nudge'}</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

