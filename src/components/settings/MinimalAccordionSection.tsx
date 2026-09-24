import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MinimalAccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  testTag?: string;
  children: React.ReactNode;
  className?: string;
}

export const MinimalAccordionSection: React.FC<MinimalAccordionSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  testTag,
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full ${className}`}
      data-testid={testTag}
    >
      {/* Transparent Clickable Header Row */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between py-4 sm:py-[18px] px-1 bg-transparent border-0 cursor-pointer select-none text-left outline-none group"
      >
        <span className="text-[17px] font-semibold tracking-[-0.2px] text-nudge-text-primary dark:text-nudge-text-primary-dark group-hover:text-nudge-blue transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-[22px] h-[22px] transition-transform duration-300 ease-out ${
            isExpanded
              ? 'rotate-180 text-nudge-blue'
              : 'rotate-0 text-nudge-text-secondary dark:text-nudge-text-secondary-dark group-hover:text-nudge-text-primary'
          }`}
        />
      </button>

      {/* Underline Divider with Animated Blue Expand From Left */}
      <div className="relative w-full h-[2px]">
        {/* 1px subtle base line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-nudge-border/80 dark:bg-nudge-border-dark/80" />
        {/* Animated active blue underline expanding from left */}
        <div
          className={`absolute left-0 top-0 h-[2px] w-full bg-nudge-blue origin-left transition-transform duration-350 ease-out ${
            isExpanded ? 'scale-x-100' : 'scale-x-0'
          }`}
        />
      </div>

      {/* Expanded Content with Smooth Animation */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 pt-2 pb-3' : 'grid-rows-[0fr] opacity-0 py-0'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="divide-y divide-nudge-border/40 dark:divide-nudge-border-dark/40">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
