import React from 'react';
import { Home, Inbox, Hourglass, Settings } from 'lucide-react';
import { NavView } from '../../types';

interface NavigationProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onNavigate,
}) => {
  const items = [
    { id: 'today' as NavView, label: 'Today', icon: Home },
    { id: 'notes' as NavView, label: 'Your Notes', icon: Inbox },
    { id: 'hours' as NavView, label: 'Hours', icon: Hourglass },
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-nudge-card-dark/95 backdrop-blur-lg border-t border-nudge-border/80 dark:border-nudge-border-dark/80 px-4 py-2 safe-bottom shadow-lg transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'text-nudge-blue'
                  : 'text-nudge-text-muted hover:text-nudge-text-secondary dark:text-nudge-text-muted-dark dark:hover:text-nudge-text-secondary-dark'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-nudge-blue-container dark:bg-nudge-blue-container-dark text-nudge-blue'
                    : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight ${
                  isActive ? 'font-semibold text-nudge-blue' : 'font-normal'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
