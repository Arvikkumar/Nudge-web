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
} from 'lucide-react';
import { useHoursTracker } from '../hooks/useHoursTracker';
import { Pursuit } from '../types';
import { TimeReportExport } from '../components/hours/TimeReportExport';

export const HoursPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'past' | 'export'>('dashboard');
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

  const currentMonthName = new Date().toLocaleString('en-US', {
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
        targetHours: Number(pursuitTarget) || 20,
        emoji: pursuitEmoji || '🎯',
      });
    } else {
      await createPursuit({
        name: pursuitName.trim(),
        targetHours: Number(pursuitTarget) || 20,
        emoji: pursuitEmoji || '🎯',
      });
    }

    setIsAddModalOpen(false);
  };

  const emojiOptions = ['📚', '✍️', '🧘', '💻', '🎨', '🏃', '🎵', '🌿', '🎯', '☕'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with Editorial Title */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-nudge-text-primary dark:text-nudge-text-primary-dark font-normal">
          Life in Hours
        </h1>
        <p className="text-xs sm:text-sm text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
          Honoring how you gently invest your most precious, finite resource: time.
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 bg-white dark:bg-nudge-card-dark p-1 rounded-2xl border border-nudge-border dark:border-nudge-border-dark shadow-xs max-w-sm">
        {(['dashboard', 'past', 'export'] as const).map((tab) => {
          const labels = {
            dashboard: 'Dashboard',
            past: 'Past Months',
            export: 'Export PDF',
          };
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-nudge-blue text-white shadow-xs font-semibold'
                  : 'text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary dark:hover:text-nudge-text-primary-dark'
              }`}
            >
              {labels[tab]}
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
                  title="Pause tracking"
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <Pause className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume tracking"
                  className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </button>
              )}

              <button
                onClick={stopTimer}
                title="Stop and save session"
                className="p-2 rounded-full bg-white/20 hover:bg-red-500/80 text-white transition-colors"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'dashboard' && (
        <>
          {/* Monthly Overview Card */}
          <section className="rounded-3xl bg-nudge-parchment dark:bg-nudge-parchment-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-nudge-blue">
                  Current Cycle
                </span>
                <h2 className="font-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
                  {currentMonthName}
                </h2>
                <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-1">
                  {totalLoggedHours.toFixed(1)} hours logged across {pursuits.length} mindful pursuits
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-white/70 dark:bg-nudge-card-dark/70 px-4 py-3 rounded-2xl border border-nudge-border dark:border-nudge-border-dark">
                  <div className="w-10 h-10 rounded-full bg-nudge-blue/10 dark:bg-nudge-blue/20 text-nudge-blue flex items-center justify-center font-bold text-sm">
                    {overallPercentage}%
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                      Monthly Pace
                    </p>
                    <p className="text-[11px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                      {totalLoggedHours.toFixed(1)} of {totalTargetHours} target hrs
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('export')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white/70 dark:bg-nudge-card-dark/70 hover:bg-white dark:hover:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark text-xs font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark transition-colors shadow-xs"
                  title="Export PDF Report"
                >
                  <FileText className="w-4 h-4 text-nudge-blue" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="w-full h-2.5 bg-white/80 dark:bg-nudge-card-dark/80 rounded-full mt-5 overflow-hidden p-0.5 border border-nudge-border/50 dark:border-nudge-border-dark/50">
              <div
                className="h-full bg-nudge-blue rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </section>

          {/* Pursuits List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold tracking-wide text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase">
                Active Pursuits ({pursuits.length})
              </h3>
              <button
                onClick={handleOpenAddModal}
                className="text-xs font-medium text-nudge-blue hover:text-nudge-blue-light flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pursuit</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {pursuits.map((item) => {
                const logged = (item.loggedMinutes || 0) / 60;
                const pct =
                  item.targetHours > 0
                    ? Math.round((logged / item.targetHours) * 100)
                    : 0;
                const isTrackingThis =
                  activeTimer?.pursuitId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border transition-all shadow-xs space-y-3 ${
                      isTrackingThis
                        ? 'border-nudge-blue ring-1 ring-nudge-blue/30'
                        : 'border-nudge-border dark:border-nudge-border-dark'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <h4 className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
                            {item.name}
                          </h4>
                          <span className="text-[11px] text-nudge-text-muted dark:text-nudge-text-muted-dark">
                            {logged.toFixed(1)} hrs invested • Goal: {item.targetHours} hrs
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Start / Pause / Tracking Button */}
                        {isTrackingThis ? (
                          <div className="flex items-center gap-1">
                            {activeTimer?.isRunning ? (
                              <button
                                onClick={pauseTimer}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1"
                              >
                                <Pause className="w-3 h-3 fill-amber-700" />
                                <span>Pause</span>
                              </button>
                            ) : (
                              <button
                                onClick={resumeTimer}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                              >
                                <Play className="w-3 h-3 fill-emerald-700" />
                                <span>Resume</span>
                              </button>
                            )}
                            <button
                              onClick={stopTimer}
                              title="Stop & Log Session"
                              className="p-1.5 rounded-full bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-secondary hover:text-red-500 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startTimer(item.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-nudge-parchment dark:bg-nudge-parchment-dark text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-blue hover:text-white transition-all flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Track</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Pursuit"
                          className="p-1.5 rounded-full hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary transition-colors"
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
                          className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-nudge-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-nudge-text-muted">
                        <span>{pct}% accomplished</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => addManualHours(item.id, 0.5)}
                            className="text-[10px] text-nudge-blue hover:underline"
                          >
                            +30m
                          </button>
                          <button
                            onClick={() => addManualHours(item.id, 1)}
                            className="text-[10px] text-nudge-blue hover:underline"
                          >
                            +1h
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-nudge-parchment dark:bg-nudge-parchment-dark rounded-full overflow-hidden">
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

      {/* PAST MONTHS TAB */}
      {activeTab === 'past' && (
        <section className="p-6 rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
              Past Investment Cycles
            </h3>
            <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Reviewing your past rhythmic hours and mindful accomplishments.
            </p>
          </div>

          <div className="divide-y divide-nudge-border/60 dark:divide-nudge-border-dark/60">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  August 2026
                </p>
                <span className="text-xs text-nudge-text-muted">
                  48.0 hours logged • 3 pursuits completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  100% Target
                </span>
                <button
                  onClick={() => setActiveTab('export')}
                  className="p-1.5 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-secondary hover:text-nudge-blue transition-colors"
                  title="Export August 2026 PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
                  July 2026
                </p>
                <span className="text-xs text-nudge-text-muted">
                  42.5 hours logged • 3 pursuits completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                  92% Target
                </span>
                <button
                  onClick={() => setActiveTab('export')}
                  className="p-1.5 rounded-xl hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-secondary hover:text-nudge-blue transition-colors"
                  title="Export July 2026 PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <TimeReportExport onBackToDashboard={() => setActiveTab('dashboard')} />
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
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePursuit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark block mb-1">
                  Pursuit Name
                </label>
                <input
                  type="text"
                  value={pursuitName}
                  onChange={(e) => setPursuitName(e.target.value)}
                  placeholder="e.g. Japanese Language Study"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/40 dark:bg-nudge-parchment-dark/40 text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark block mb-1">
                  Monthly Goal (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={pursuitTarget}
                  onChange={(e) => setPursuitTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/40 dark:bg-nudge-parchment-dark/40 text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark block mb-1">
                  Symbol / Emoji
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {emojiOptions.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setPursuitEmoji(em)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        pursuitEmoji === em
                          ? 'bg-nudge-blue text-white shadow-xs scale-105'
                          : 'bg-nudge-parchment dark:bg-nudge-parchment-dark hover:bg-nudge-blue/10'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-nudge-blue text-white hover:bg-nudge-blue-light transition-colors shadow-xs"
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
