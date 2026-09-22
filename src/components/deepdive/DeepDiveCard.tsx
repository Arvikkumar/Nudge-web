import React, { useState, useEffect } from 'react';
import { Play, Hourglass } from 'lucide-react';
import {
  DeepDiveState,
  formatClockTime,
  formatTimeRemaining,
} from '../../utils/deepDive';

interface DeepDiveCardProps {
  state: DeepDiveState;
  onOpenConfig: () => void;
  onOpenActive: () => void;
}

export const DeepDiveCard: React.FC<DeepDiveCardProps> = ({
  state,
  onOpenConfig,
  onOpenActive,
}) => {
  const [now, setNow] = useState(Date.now());

  // Real-time ticking for live countdown when active
  useEffect(() => {
    if (!state.isActive) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isActive]);

  const isActuallyActive = state.isActive && state.endTimeMillis > now;
  const formattedClock = isActuallyActive ? formatClockTime(state.endTimeMillis) : '';
  const remainingStr = isActuallyActive ? formatTimeRemaining(state.endTimeMillis, now) : '';

  const handleClick = () => {
    if (isActuallyActive) {
      onOpenActive();
    } else {
      onOpenConfig();
    }
  };

  return (
    <section
      onClick={handleClick}
      className={`rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs ${
        isActuallyActive
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/80 ring-2 ring-emerald-500/10'
          : 'bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark hover:border-emerald-500/40'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${
            isActuallyActive
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isActuallyActive ? <Hourglass className="w-5 h-5 animate-pulse" /> : '🌱'}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isActuallyActive
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Deep Dive
            </span>
            {isActuallyActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Active
              </span>
            ) : (
              <span className="text-[11px] text-nudge-text-muted dark:text-nudge-text-muted-dark">
                • Focus Mode
              </span>
            )}
          </div>

          {isActuallyActive ? (
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 mt-0.5">
              In progress · until {formattedClock} ({remainingStr})
            </p>
          ) : (
            <p className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
              Choose a moment, make it yours.
            </p>
          )}
        </div>
      </div>

      {/* Right Circular Action Button matching Android */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md ${
          isActuallyActive
            ? 'bg-emerald-600 text-white shadow-emerald-600/25'
            : 'bg-emerald-600 text-white shadow-emerald-600/20'
        }`}
        title={isActuallyActive ? 'View active session' : 'Begin Deep Dive'}
      >
        {isActuallyActive ? (
          <Hourglass className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>
    </section>
  );
};
