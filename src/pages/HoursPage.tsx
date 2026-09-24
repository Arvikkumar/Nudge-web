import React, { useState } from 'react';
import {
  Hourglass,
  Calendar,
  TrendingUp,
  Sparkles,
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  Edit2,
  Clock,
  X,
  CheckCircle,
  FileText,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { useHoursTracker } from '../hooks/useHoursTracker';
import { Pursuit } from '../types';
import { TimeReportExport } from '../components/hours/TimeReportExport';

export const HoursPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cycle' | 'past_months' | 'review'>('cycle');
  const [selectedReportYear, setSelectedReportYear] = useState<number>(new Date().getFullYear());
  const [selectedReportMonth, setSelectedReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPursuit, setEditingPursuit] = useState<Pursuit | null>(null);

  // Form states for Add / Edit Pursuit
  const [pursuitName, setPursuitName] = useState('');
  const [pursuitTarget, setPursuitTarget] = useState(20);
  const [pursuitEmoji, setPursuitEmoji] = useState('🎯');

  const {
    pursuits,
    isLoading,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    createPursuit,
    editPursuit,
    deletePursuit,
    addManualHours,
  } = useHoursTracker();

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const totalLoggedHours = pursuits.reduce(
    (acc, curr) => acc + (curr.loggedMinutes || 0) / 60,
    0
  );
  const totalTargetHours = pursuits.reduce(
    (acc, curr) => acc + curr.targetHours,
    0
  );
  const overallPercentage =
    totalTargetHours > 0
      ? Math.round((totalLoggedHours / totalTargetHours) * 100)
      : 0;

  // Handlers for switching to Monthly Review & Export
  const handleOpenCurrentMonthExport = () => {
    const current = new Date();
    setSelectedReportYear(current.getFullYear());
    setSelectedReportMonth(current.getMonth() + 1);
    setActiveTab('review');
  };

  const handleSelectPastMonth = (year: number, month: number) => {
    setSelectedReportYear(year);
    setSelectedReportMonth(month);
    setActiveTab('review');
  };

  // Format timer seconds into HH:MM:SS
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const handleOpenAddModal = () => {
    setEditingPursuit(null);
    setPursuitName('');
    setPursuitTarget(20);
    setPursuitEmoji('🎯');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Pursuit) => {
    setEditingPursuit(p);
    setPursuitName(p.name);
    setPursuitTarget(p.targetHours);
    setPursuitEmoji(p.emoji);
    setIsAddModalOpen(true);
  };

  const handleSavePursuit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pursuitName.trim()) return;

    if (editingPursuit) {
      await editPursuit({
        ...editingPursuit,
        name: pursuitName.trim(),
        targetHours: Number(pursuitTarget) || 1,
        emoji: pursuitEmoji,
      });
    } else {
      await createPursuit({
        name: pursuitName.trim(),
        targetHours: Number(pursuitTarget) || 1,
        emoji: pursuitEmoji,
      });
    }

    setIsAddModalOpen(false);
  };

  // Generate list of past 6 months for "Past Months" tab
  const pastMonthsList = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      name: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    };
  });

  const emojiOptions = ['📚', '✍️', '🧘', '💻', '🎨', '🏃', '🎵', '🌿', '🎯', '☕'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 sm:pb-8 animate-in fade-in duration-300" data-testid="hours_screen">
      {/* Header section with Editorial Title matching LifeInHoursScreen.kt */}
      <div className="space-y-1">
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal leading-tight">
          The life within
        </h1>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl text-nudge-blue dark:text-nudge-blue-light font-normal leading-tight">
          the hours
        </h1>
        <p className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark pt-1">
          Choose where your hours go.
        </p>
      </div>

      {/* Sub-tab navigation: Clean Segmented Control matching HoursSubNavTabs in Android */}
      <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs max-w-lg w-full">
        {(
          [
            { id: 'cycle', label: 'Current Cycle' },
            { id: 'past_months', label: 'Past Months' },
            { id: 'review', label: 'Monthly Review & Export' },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'review') {
                  const current = new Date();
                  setSelectedReportYear(current.getFullYear());
                  setSelectedReportMonth(current.getMonth() + 1);
                }
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-medium transition-all text-center leading-tight cursor-pointer ${
                isSelected
                  ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                  : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ACTIVE TRACKING FLOATING BANNER */}
      {activeTimer && (
        <section className="p-4 rounded-3xl bg-blue-600 text-white shadow-md animate-in slide-in-from-top-2 duration-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">
              <span className={activeTimer.isRunning ? 'animate-pulse' : ''}>
                ⏱
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  {activeTimer.isRunning ? 'Currently Tracking' : 'Tracking Paused'}
                </span>
                {activeTimer.isRunning && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <p className="font-medium text-base text-white">
                {activeTimer.pursuitName || 'Mindful Pursuit'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-2xl font-bold tracking-wider text-white">
              {formatTimer(activeTimer.elapsedSeconds)}
            </span>

            <div className="flex items-center gap-1.5">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Pause tracking"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-2.5 rounded-full bg-white text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Resume tracking"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}
              <button
                onClick={stopTimer}
                className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="Save & log hours"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 1. CURRENT CYCLE TAB */}
      {activeTab === 'cycle' && (
        <>
          {/* Main Dashboard Hero Card */}
          <section className="p-6 rounded-[28px] bg-gradient-to-br from-nudge-parchment/80 to-white dark:from-nudge-card-dark dark:to-neutral-900 border border-nudge-border dark:border-nudge-border-dark shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-nudge-blue" />
                <h2 className="text-base font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  {currentMonthName}
                </h2>
              </div>

              <button
                onClick={handleOpenCurrentMonthExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-nudge-card-dark/80 hover:bg-white dark:hover:bg-nudge-card-dark border border-nudge-border/70 dark:border-nudge-border-dark/70 text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Review & Export Current Month PDF"
              >
                <FileText className="w-3.5 h-3.5 text-nudge-blue" />
                <span>Export PDF</span>
              </button>
            </div>

            {/* Primary metric: Total Hours Invested */}
            <div className="pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-editorial-serif text-4xl sm:text-5xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark tracking-tight">
                  {totalLoggedHours.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  hours invested
                </span>
              </div>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  Pace: <strong className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">{overallPercentage}%</strong> of {totalTargetHours} target hrs
                </span>
                <span className="text-nudge-border dark:text-nudge-border-dark">•</span>
                <span>{pursuits.length} active pursuits</span>
              </p>
            </div>

            {/* Global Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="w-full h-2 bg-white/90 dark:bg-nudge-card-dark/90 rounded-full overflow-hidden p-0.5 border border-nudge-border/40 dark:border-nudge-border-dark/40">
                <div
                  className="h-full bg-nudge-blue rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>
            </div>
          </section>

          {/* Pursuits List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase">
                Active Pursuits ({pursuits.length})
              </h3>
              <button
                onClick={handleOpenAddModal}
                className="text-xs font-medium text-nudge-blue hover:text-nudge-blue-light flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-2xs hover:bg-nudge-parchment transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pursuit</span>
              </button>
            </div>

            <div className="space-y-3">
              {pursuits.map((item) => {
                const loggedHrs = (item.loggedMinutes || 0) / 60;
                const pct =
                  item.targetHours > 0
                    ? Math.min(Math.round((loggedHrs / item.targetHours) * 100), 100)
                    : 0;
                const isCurrentlyTracking =
                  activeTimer && activeTimer.pursuitId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-2xs hover:border-nudge-blue/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-nudge-parchment dark:bg-nudge-parchment-dark shrink-0">
                          {item.emoji}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                            {item.name}
                          </h4>
                          <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                            <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                              {loggedHrs.toFixed(1)}h
                            </span>{' '}
                            of {item.targetHours}h monthly goal
                          </p>
                        </div>
                      </div>

                      {/* Right Quick Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrentlyTracking ? (
                          <button
                            onClick={stopTimer}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <Square className="w-3 h-3" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimer(item.id)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-blue hover:text-white transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Track</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Pursuit"
                          className="p-1.5 rounded-lg hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete pursuit "${item.name}"?`)) {
                              deletePursuit(item.id);
                            }
                          }}
                          title="Delete Pursuit"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-nudge-text-muted hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-nudge-text-muted dark:text-nudge-text-muted-dark">
                        <span className="font-medium text-[11px]">{pct}% accomplished</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => addManualHours(item.id, 0.5)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark hover:bg-nudge-blue hover:text-white text-nudge-blue transition-colors cursor-pointer"
                            title="Add 30 minutes"
                          >
                            +30m
                          </button>
                          <button
                            onClick={() => addManualHours(item.id, 1)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark hover:bg-nudge-blue hover:text-white text-nudge-blue transition-colors cursor-pointer"
                            title="Add 1 hour"
                          >
                            +1h
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-nudge-parchment dark:bg-nudge-parchment-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-nudge-blue rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* 2. PAST MONTHS TAB matching HoursTab.PAST_MONTHS */}
      {activeTab === 'past_months' && (
        <section className="space-y-3">
          <div className="px-1">
            <h3 className="text-xs font-semibold tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase">
              Historical Monthly Cycles
            </h3>
            <p className="text-xs text-nudge-text-muted dark:text-nudge-text-muted-dark mt-0.5">
              Review completed cycles and export historical reports.
            </p>
          </div>

          <div className="space-y-2.5">
            {pastMonthsList.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-2xs hover:border-nudge-blue/50 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-nudge-blue" />
                    <h4 className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                      {m.name}
                    </h4>
                  </div>
                  <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                    Completed monthly cycle
                  </p>
                </div>

                <button
                  onClick={() => handleSelectPastMonth(m.year, m.month)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-blue dark:text-nudge-blue-light text-xs font-semibold hover:bg-nudge-blue hover:text-white transition-colors cursor-pointer"
                >
                  <span>Review & PDF</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. MONTHLY REVIEW & EXPORT TAB */}
      {activeTab === 'review' && (
        <TimeReportExport
          initialYear={selectedReportYear}
          initialMonth={selectedReportMonth}
          onBackToDashboard={() => setActiveTab('cycle')}
        />
      )}

      {/* ADD / EDIT PURSUIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {editingPursuit ? 'Edit Pursuit' : 'New Mindful Pursuit'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePursuit} className="space-y-4">
              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setPursuitEmoji(e)}
                      className={`text-xl p-2 rounded-xl border transition-all ${
                        pursuitEmoji === e
                          ? 'border-nudge-blue bg-nudge-blue/10 scale-105'
                          : 'border-nudge-border dark:border-nudge-border-dark hover:bg-nudge-parchment'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pursuit Name */}
              <div>
                <label className="block text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={pursuitName}
                  onChange={(e) => setPursuitName(e.target.value)}
                  placeholder="e.g. Reading, Writing, Deep Work..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-transparent text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>

              {/* Monthly Target (Hours) */}
              <div>
                <label className="block text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider mb-1">
                  Monthly Target (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    required
                    value={pursuitTarget}
                    onChange={(e) => setPursuitTarget(Number(e.target.value))}
                    className="w-24 px-3.5 py-2.5 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-transparent text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                  />
                  <span className="text-xs text-nudge-text-muted">
                    ~{(pursuitTarget / 4).toFixed(1)} hrs / week
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary hover:text-nudge-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors"
                >
                  {editingPursuit ? 'Save Changes' : 'Create Pursuit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
