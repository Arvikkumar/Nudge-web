import React from 'react';

interface ThemeToggleSwitchProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  isDark,
  onToggle,
  className = '',
}) => {
  return (
    <div
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      data-testid="theme_toggle_switch"
      className={`group relative flex items-center justify-center min-w-[56px] min-h-[48px] cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-nudge-blue focus-visible:ring-offset-2 rounded-full ${className}`}
    >
      {/* Track Pill */}
      <div
        className={`relative w-[50px] h-[26px] rounded-full overflow-hidden transition-colors duration-200 ease-in-out border ${
          isDark
            ? 'bg-[#1C1A17] border-[#38332C]'
            : 'bg-[#508CE0] border-[#7EACEC]'
        }`}
      >
        {/* Background Canvas: Clouds (Light mode) & Stars (Dark mode) */}
        {isDark ? (
          /* Dark mode: Stars & Stardust */
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-200">
            {/* Star 1 - 4-point sparkle */}
            <svg
              className="absolute left-[8px] top-[4px] w-[9px] h-[9px] text-white/90"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
            {/* Star 2 - small sparkle */}
            <svg
              className="absolute left-[19px] top-[14px] w-[6px] h-[6px] text-white/80"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
            {/* Star dots */}
            <span className="absolute left-[7px] top-[16px] w-[2px] h-[2px] rounded-full bg-white/70" />
            <span className="absolute left-[18px] top-[5px] w-[1.5px] h-[1.5px] rounded-full bg-white/70" />
            <span className="absolute left-[24px] top-[10px] w-[1px] h-[1px] rounded-full bg-white/50" />
          </div>
        ) : (
          /* Light mode: Fluffy white clouds on the lower right */
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-200">
            {/* Cloud backdrop puff */}
            <div className="absolute right-[12px] bottom-[3px] w-[11px] h-[11px] rounded-full bg-[#D4E6FA]/70" />
            {/* Cloud puffs */}
            <div className="absolute right-[14px] bottom-[0px] w-[10px] h-[10px] rounded-full bg-white/95" />
            <div className="absolute right-[6px] bottom-[2px] w-[13px] h-[13px] rounded-full bg-white/95" />
            <div className="absolute right-[1px] bottom-[0px] w-[9px] h-[9px] rounded-full bg-white/95" />
            <div className="absolute right-[0px] bottom-[0px] w-[24px] h-[5px] rounded-b-full bg-white/95" />
          </div>
        )}

        {/* Sliding Thumb: Sun (Light) / Moon (Dark) */}
        <div
          className={`absolute top-[2.5px] w-[20px] h-[20px] rounded-full transition-transform duration-200 ease-out shadow-xs flex items-center justify-center ${
            isDark
              ? 'translate-x-[26.5px] bg-[#F0F3F6]'
              : 'translate-x-[2.5px] bg-[#FFCA28]'
          }`}
        >
          {isDark ? (
            /* Moon crater details */
            <div className="relative w-full h-full">
              <span className="absolute top-[4px] left-[5px] w-[4px] h-[4px] rounded-full bg-[#D3D8DE]/80" />
              <span className="absolute bottom-[4px] left-[7px] w-[5px] h-[5px] rounded-full bg-[#D3D8DE]/80" />
              <span className="absolute top-[8px] right-[4px] w-[3px] h-[3px] rounded-full bg-[#D3D8DE]/80" />
            </div>
          ) : (
            /* Sun subtle warm center ring */
            <div className="w-[10px] h-[10px] rounded-full bg-[#FFA000]/20" />
          )}
        </div>
      </div>
    </div>
  );
};
