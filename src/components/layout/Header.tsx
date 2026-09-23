import React from 'react';
import { GentleNudgeLogo } from '../common/GentleNudgeLogo';
import { UserNameBadge } from '../common/UserNameBadge';
import { ThemeToggle } from '../common/ThemeToggle';
import { NavView, ThemeMode } from '../../types';
import { Home, Inbox, Hourglass, Settings } from 'lucide-react';

interface HeaderProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  userName: string;
  onUpdateName: (name: string) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  userName,
  onUpdateName,
  themeMode,
  onToggleTheme,
}) => {
  // Format current date matching Android: "EEEE, d MMMM"
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const navItems = [
    { id: 'today' as NavView, label: 'Today', icon: Home },
    { id: 'notes' as NavView, label: 'Your Notes', icon: Inbox },
    { id: 'hours' as NavView, label: 'Hours', icon: Hourglass },
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-nudge-cream/90 dark:bg-nudge-dark/90 backdrop-blur-md border-b border-nudge-border/60 dark:border-nudge-border-dark/60 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('today')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <GentleNudgeLogo size={28} />
            <span className="text-xl font-bold tracking-tight text-nudge-text-primary dark:text-nudge-text-primary-dark">
              nudge
            </span>
          </button>
          
          <span className="hidden md:inline-block w-px h-5 bg-nudge-border dark:bg-nudge-border-dark" />
          
          <span className="hidden md:inline-block text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark tracking-wide">
            {dateFormatted}
          </span>
        </div>

        {/* Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-nudge-parchment/70 dark:bg-nudge-parchment-dark/70 p-1 rounded-full border border-nudge-border/60 dark:border-nudge-border-dark/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white dark:bg-nudge-card-dark text-nudge-blue dark:text-nudge-blue shadow-xs font-semibold'
                    : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-nudge-blue stroke-[2.2]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: User Avatar Badge & Theme Switcher */}
        <div className="flex items-center gap-2">
          <UserNameBadge userName={userName} onUpdateName={onUpdateName} />
          <ThemeToggle themeMode={themeMode} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </header>
  );
};
