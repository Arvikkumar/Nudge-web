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
    <div className="w-full max-w-sm">
      <div className="flex items-center p-1 rounded-full bg-nudge-parchment/60 dark:bg-nudge-card-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 shadow-2xs">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabSelected(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer text-center leading-tight whitespace-nowrap ${
                isSelected
                  ? 'bg-nudge-blue text-white shadow-2xs font-bold'
                  : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark font-medium'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
