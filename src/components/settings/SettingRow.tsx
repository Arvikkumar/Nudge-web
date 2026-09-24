import React from 'react';
import { Check, X } from 'lucide-react';

interface NudgeIconToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  testTag?: string;
  ariaLabel?: string;
}

export const NudgeIconToggle: React.FC<NudgeIconToggleProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  testTag,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      data-testid={testTag}
      className={`relative inline-flex items-center justify-center min-w-[56px] min-h-[48px] bg-transparent border-0 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-nudge-blue rounded-full transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {/* Pill Track (52px x 30px matching Android NudgeIconToggle) */}
      <div
        className={`relative w-[52px] h-[30px] rounded-full transition-colors duration-200 ease-in-out ${
          checked
            ? 'bg-nudge-blue'
            : 'bg-zinc-200 dark:bg-[#34302A]'
        }`}
      >
        {/* ON icon: subtle checkmark on the left */}
        <div className="absolute left-[8px] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          {checked && <Check className="w-3.5 h-3.5 text-white/95 stroke-[2.5]" />}
        </div>

        {/* OFF icon: subtle soft cross on the right */}
        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          {!checked && (
            <X className="w-3 h-3 text-zinc-500 dark:text-zinc-400 stroke-[2.5]" />
          )}
        </div>

        {/* Circular White Thumb (24px x 24px) */}
        <div
          className={`absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-xs transition-transform duration-200 ease-out ${
            checked ? 'translate-x-[25px]' : 'translate-x-[3px]'
          }`}
        />
      </div>
    </button>
  );
};

export interface SettingToggleRowProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  testTag?: string;
}

export const SettingToggleRow: React.FC<SettingToggleRowProps> = ({
  icon,
  iconBgColor = 'bg-nudge-blue/10 dark:bg-nudge-blue-container-dark',
  iconTextColor = 'text-nudge-blue dark:text-nudge-blue-light',
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  testTag,
}) => {
  return (
    <div className="flex items-center justify-between py-3 sm:py-3.5 gap-3.5">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 ${iconBgColor} ${iconTextColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm sm:text-[15px] font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-[-0.1px]">
            {title}
          </p>
          <p className="text-xs sm:text-[13px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 pl-2">
        <NudgeIconToggle
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          testTag={testTag}
          ariaLabel={title}
        />
      </div>
    </div>
  );
};

export interface SettingActionRowProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  title: string;
  description: string;
  actionText: string;
  onClick: () => void;
  disabled?: boolean;
  isDestructive?: boolean;
  testTag?: string;
}

export const SettingActionRow: React.FC<SettingActionRowProps> = ({
  icon,
  iconBgColor = 'bg-nudge-blue/10 dark:bg-nudge-blue-container-dark',
  iconTextColor = 'text-nudge-blue dark:text-nudge-blue-light',
  title,
  description,
  actionText,
  onClick,
  disabled = false,
  isDestructive = false,
  testTag,
}) => {
  return (
    <div
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={`flex items-center justify-between py-3 sm:py-3.5 gap-3.5 group rounded-2xl transition-colors cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 ${iconBgColor} ${iconTextColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm sm:text-[15px] font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-[-0.1px]">
            {title}
          </p>
          <p className="text-xs sm:text-[13px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 pl-2">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onClick();
          }}
          data-testid={testTag}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isDestructive
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
              : 'bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 text-nudge-text-primary dark:text-nudge-text-primary-dark border-nudge-border/60 dark:border-nudge-border-dark/60 hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark shadow-2xs'
          }`}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
};

export interface SettingInfoRowProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  title: string;
  description: string;
  valueText: string;
  testTag?: string;
}

export const SettingInfoRow: React.FC<SettingInfoRowProps> = ({
  icon,
  iconBgColor = 'bg-nudge-blue/10 dark:bg-nudge-blue-container-dark',
  iconTextColor = 'text-nudge-blue dark:text-nudge-blue-light',
  title,
  description,
  valueText,
  testTag,
}) => {
  return (
    <div
      className="flex items-center justify-between py-3 sm:py-3.5 gap-3.5"
      data-testid={testTag}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 ${iconBgColor} ${iconTextColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm sm:text-[15px] font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-[-0.1px]">
            {title}
          </p>
          <p className="text-xs sm:text-[13px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark pt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 pl-2">
        <span className="inline-block py-1 px-2.5 rounded-lg text-xs font-semibold bg-nudge-surface-variant dark:bg-nudge-surface-variant-dark text-nudge-text-primary dark:text-nudge-text-primary-dark border border-nudge-border/40 dark:border-nudge-border-dark/40">
          {valueText}
        </span>
      </div>
    </div>
  );
};
