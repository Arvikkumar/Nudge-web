import React, { useState } from 'react';
import { Mic, Send } from 'lucide-react';

interface QuickCaptureBarProps {
  onOpenComposer: (draftText?: string) => void;
  onQuickAdd: (text: string) => Promise<void>;
  onStartVoice: () => void;
  isListening: boolean;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({
  onOpenComposer,
  onQuickAdd,
  onStartVoice,
  isListening,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onQuickAdd(trimmed);
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-1.5 rounded-[18px] bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs"
    >
      <button
        type="button"
        onClick={onStartVoice}
        className={`p-2 rounded-xl transition-all ${
          isListening
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse'
            : 'text-nudge-blue hover:bg-nudge-blue/10 dark:hover:bg-nudge-blue/20'
        }`}
        title={isListening ? 'Listening…' : 'Speak reminder'}
        data-testid="quick_capture_mic_button"
      >
        <Mic className="w-4 h-4" />
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a gentle reminder or note…"
        disabled={isSubmitting}
        className="flex-1 px-2 py-1.5 text-sm bg-transparent text-nudge-text-primary dark:text-nudge-text-primary-dark placeholder:text-nudge-text-muted focus:outline-none"
      />

      <button
        type="submit"
        disabled={!text.trim() || isSubmitting}
        className="p-2 rounded-xl bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors disabled:opacity-40 cursor-pointer"
        title="Add reminder"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
