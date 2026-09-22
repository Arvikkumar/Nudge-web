import React, { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import {
  DeepDiveState,
  formatClockTime,
  formatTimeRemaining,
} from '../../utils/deepDive';

interface DeepDiveGlobalIndicatorProps {
  state: DeepDiveState;
  onOpenActive: () => void;
}

export const DeepDiveGlobalIndicator: React.FC<DeepDiveGlobalIndicatorProps> = ({
  state,
  onOpenActive,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!state.isActive) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isActive]);

  const isActuallyActive = state.isActive && state.endTimeMillis > now;
  if (!isActuallyActive) return null;

  const remainingStr = formatTimeRemaining(state.endTimeMillis, now);
  const formattedClock = formatClockTime(state.endTimeMillis);

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <button
        onClick={onOpenActive}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 border border-emerald-400/30 transition-all hover:scale-105 active:scale-95 group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <Hourglass className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
        <span className="text-xs font-semibold tracking-wide">
          Deep Dive · <span className="font-mono">{remainingStr}</span>
        </span>
      </button>
    </div>
  );
};
