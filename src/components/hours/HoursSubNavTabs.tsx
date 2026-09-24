import React from 'react';

export type HoursTabType = 'dashboard' | 'past_months' | 'export';

interface HoursSubNavTabsProps {
  activeTab: HoursTabType;
  onTabSelected: (tab: HoursTabType) => void;
}

const TABS: { id: HoursTabType; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'past_months', label: 'Past Months' },
  { id: 'export', label: 'Export PDF' },
];

export const HoursSubNavTabs: React.FC<HoursSubNavTabsProps> = ({
  activeTab,
  onTabSelected,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-lg w-full no-scrollbar">
      {TABS.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabSelected(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              isSelected
                ? 'bg-nudge-blue text-white shadow-2xs'
                : 'bg-white/80 dark:bg-nudge-card-dark/80 hover:bg-white dark:hover:bg-nudge-card-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark border border-nudge-border/70 dark:border-nudge-border-dark/70'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
