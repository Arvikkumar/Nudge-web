import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { NavView, ThemeMode } from '../../types';
import { Plus } from 'lucide-react';

interface AppShellProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  userName: string;
  onUpdateName: (name: string) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  children: React.ReactNode;
  onOpenQuickAdd?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeView,
  onNavigate,
  userName,
  onUpdateName,
  themeMode,
  onToggleTheme,
  children,
  onOpenQuickAdd,
}) => {
  const showFab = (activeView === 'today' || activeView === 'notes') && onOpenQuickAdd;

  return (
    <div className="min-h-screen bg-nudge-cream dark:bg-nudge-dark text-nudge-text-primary dark:text-nudge-text-primary-dark flex flex-col font-sans transition-colors duration-200">
      {/* Top App Bar */}
      <Header
        activeView={activeView}
        onNavigate={onNavigate}
        userName={userName}
        onUpdateName={onUpdateName}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28">
        {children}
      </main>

      {/* Floating Action Button (Today & Your Notes) */}
      {showFab && (
        <button
          onClick={onOpenQuickAdd}
          className="fixed bottom-22 right-5 sm:bottom-24 sm:right-8 z-30 w-14 h-14 rounded-full bg-nudge-blue hover:bg-nudge-blue-light text-white shadow-float flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-nudge-blue/20"
          aria-label="Add gentle reminder"
          title="Add a gentle reminder"
          data-testid="main-fab-add"
        >
          <Plus className="w-6 h-6 stroke-[2.4]" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <Navigation activeView={activeView} onNavigate={onNavigate} />
    </div>
  );
};
