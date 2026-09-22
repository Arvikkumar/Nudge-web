import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../../types';

interface ThemeToggleProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  themeMode,
  onToggleTheme,
  className = '',
}) => {
  const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={onToggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-full border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark hover:opacity-80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nudge-blue/40 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in fade-in duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-nudge-text-secondary animate-in fade-in duration-200" />
      )}
    </button>
  );
};
