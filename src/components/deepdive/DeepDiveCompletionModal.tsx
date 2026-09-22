import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { formatDurationLabel } from '../../utils/deepDive';

interface DeepDiveCompletionModalProps {
  isOpen: boolean;
  durationMinutes: number;
  onDismiss: () => void;
}

export const DeepDiveCompletionModal: React.FC<DeepDiveCompletionModalProps> = ({
  isOpen,
  durationMinutes,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-nudge-card-dark rounded-3xl shadow-xl border border-nudge-border dark:border-nudge-border-dark overflow-hidden p-6 text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-inner">
          🪴
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Deep Dive Complete
            </span>
          </div>
          <h2 className="text-2xl font-serif text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal">
            A Peaceful Moment Kept
          </h2>
          <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark leading-relaxed max-w-xs mx-auto">
            You completed {formatDurationLabel(durationMinutes)} of undisturbed focus.
            Take a deep breath and gently return to your rhythm.
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Return to Today</span>
        </button>
      </div>
    </div>
  );
};
