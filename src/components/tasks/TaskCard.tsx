import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Trash2,
  Repeat,
  Bell,
} from 'lucide-react';
import { NudgeTask } from '../../types';
import { getCategoryStyle } from '../../utils/categoryColors';
import { isRepeatingTask, isTaskCompletedOnDate, getTodayIso } from '../../utils/recurrence';

interface TaskCardProps {
  task: NudgeTask;
  occurrenceDateIso?: string;
  onToggleDone: (id: number, dateIso?: string) => void;
  onEdit: (task: NudgeTask) => void;
  onDelete: (id: number) => void;
  onSnooze?: (id: number, snoozeType: '30m' | 'tonight' | 'tomorrow') => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  occurrenceDateIso,
  onToggleDone,
  onEdit,
  onDelete,
  onSnooze,
}) => {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const categoryStyle = getCategoryStyle(task.category);
  const targetDateIso = occurrenceDateIso || getTodayIso();
  const isDone = isTaskCompletedOnDate(task, targetDateIso);
  const repeats = isRepeatingTask(task);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false);
      }
    };
    if (showSnoozeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSnoozeMenu]);

  return (
    <div
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-[18px] bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs transition-all hover:border-nudge-blue/40 overflow-hidden ${
        isDone ? 'opacity-65 bg-nudge-cream/60 dark:bg-nudge-dark/60' : ''
      }`}
      data-testid={`task_item_${task.id}`}
    >
      {/* Left vertical colored accent stripe matching TaskSlipItem.kt */}
      <div
        className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${
          isDone
            ? 'bg-nudge-blue/35 dark:bg-nudge-blue/35'
            : 'bg-nudge-blue dark:bg-nudge-blue-light'
        }`}
        aria-hidden="true"
      />

      <div className="flex items-center gap-3.5 flex-1 min-w-0 pl-1.5">
        {/* Android-styled circular Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(task.id, targetDateIso);
          }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-nudge-blue/10 dark:hover:bg-nudge-blue/20 transition-all focus:outline-none"
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
          data-testid={`task_check_${task.id}`}
        >
          {isDone ? (
            <div className="w-[22px] h-[22px] rounded-full bg-nudge-blue flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-[18px] h-[18px] text-white stroke-[2.4]" />
            </div>
          ) : (
            <div className="w-[22px] h-[22px] rounded-full border-[1.8px] border-nudge-blue/60 dark:border-nudge-blue/50 hover:border-nudge-blue transition-colors" />
          )}
        </button>

        {/* Task Title and Badges */}
        <div
          onClick={() => onEdit(task)}
          className="flex-1 min-w-0 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <p
              className={`text-[15px] font-medium leading-snug truncate ${
                isDone
                  ? 'line-through text-nudge-text-muted dark:text-nudge-text-muted-dark'
                  : 'text-nudge-text-primary dark:text-nudge-text-primary-dark'
              }`}
            >
              {task.title}
            </p>
            {task.priority === 'Important' && !isDone && (
              <span
                className="w-2 h-2 rounded-full bg-nudge-important shrink-0 shadow-xs"
                title="Important"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-nudge-text-muted dark:text-nudge-text-muted-dark font-sans">
              <Clock className="w-3 h-3 text-nudge-text-muted stroke-[1.8]" />
              {!repeats && task.dateLabel && task.dateLabel !== 'Today'
                ? `${task.dateLabel} • `
                : ''}
              {task.timeLabel}
            </span>

            {repeats && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark border border-nudge-border/60 dark:border-nudge-border-dark/60">
                <Repeat className="w-2.5 h-2.5 text-nudge-blue" />
                <span>{task.repeat}</span>
              </span>
            )}

            {task.category && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${categoryStyle.bg} ${categoryStyle.text}`}
              >
                {task.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
        {/* Snooze / Remind Me Menu Button */}
        {onSnooze && !isDone && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSnoozeMenu((prev) => !prev);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                showSnoozeMenu
                  ? 'bg-nudge-blue/10 text-nudge-blue'
                  : 'text-nudge-text-muted hover:text-nudge-blue hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark'
              }`}
              title="Remind me / Snooze"
              aria-label="Remind me options"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {showSnoozeMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-nudge-card-dark rounded-2xl shadow-float border border-nudge-border dark:border-nudge-border-dark py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-nudge-text-muted dark:text-nudge-text-muted-dark border-b border-nudge-border/50 dark:border-nudge-border-dark/50">
                  Remind me
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSnoozeMenu(false);
                    onSnooze(task.id, '30m');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors flex items-center justify-between"
                >
                  <span>In 30 minutes</span>
                  <span className="text-[10px] text-nudge-text-muted">⏱</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSnoozeMenu(false);
                    onSnooze(task.id, 'tonight');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors flex items-center justify-between"
                >
                  <span>Tonight</span>
                  <span className="text-[10px] text-nudge-text-muted">8:00 PM</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSnoozeMenu(false);
                    onSnooze(task.id, 'tomorrow');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors flex items-center justify-between"
                >
                  <span>Tomorrow</span>
                  <span className="text-[10px] text-nudge-text-muted">9:00 AM</span>
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 rounded-lg text-nudge-text-muted hover:text-nudge-text-primary hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-colors"
          title="Edit"
          aria-label="Edit reminder"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1.5 rounded-lg text-nudge-text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          title="Delete"
          aria-label="Delete reminder"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
