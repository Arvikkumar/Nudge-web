import React from 'react';
import { X, RotateCcw, Trash2, Clock, Check } from 'lucide-react';
import { NudgeTask } from '../../types';

interface RecentlyDeletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedTasks: NudgeTask[];
  onRestoreTask: (id: number) => Promise<void>;
}

export const RecentlyDeletedModal: React.FC<RecentlyDeletedModalProps> = ({
  isOpen,
  onClose,
  deletedTasks,
  onRestoreTask,
}) => {
  const [restoringId, setRestoringId] = React.useState<number | null>(null);
  const [restoredIds, setRestoredIds] = React.useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleRestore = async (id: number) => {
    try {
      setRestoringId(id);
      await onRestoreTask(id);
      setRestoredIds((prev) => new Set(prev).add(id));
    } finally {
      setRestoringId(null);
    }
  };

  const activeDeletedList = deletedTasks.filter((t) => !restoredIds.has(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-nudge-card-dark rounded-3xl shadow-xl border border-nudge-border dark:border-nudge-border-dark overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-nudge-border/50 dark:border-nudge-border-dark/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400">
              Trash & History
            </span>
            <h2 className="text-xl font-serif text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              Recently Deleted Tasks
            </h2>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-1">
              Restore any nudge you removed back to your active list.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {activeDeletedList.length === 0 ? (
            <div className="p-8 text-center text-nudge-text-secondary space-y-2">
              <div className="w-10 h-10 rounded-full bg-nudge-parchment dark:bg-nudge-parchment-dark flex items-center justify-center mx-auto text-nudge-text-muted">
                <Trash2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
                No deleted tasks
              </p>
              <p className="text-[11px] text-nudge-text-muted">
                Tasks you delete will be available here for easy recovery.
              </p>
            </div>
          ) : (
            activeDeletedList.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-nudge-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.timeLabel}
                    </span>
                    <span>•</span>
                    <span>{task.category || 'Personal'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(task.id)}
                  disabled={restoringId === task.id}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-nudge-card-dark text-nudge-blue hover:bg-nudge-blue hover:text-white border border-nudge-border dark:border-nudge-border-dark shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-nudge-cream/40 dark:bg-nudge-dark/40 border-t border-nudge-border/50 dark:border-nudge-border-dark/50 flex items-center justify-between">
          <span className="text-xs text-nudge-text-secondary">
            {activeDeletedList.length} {activeDeletedList.length === 1 ? 'item' : 'items'} in trash
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
