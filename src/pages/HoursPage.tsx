import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon,
  FileText,
  History,
  Check,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useHoursTracker } from '../hooks/useHoursTracker';
import { Pursuit, TimeGoalRecord } from '../types';
import * as db from '../db/nudgeDb';
import { calculateMonthlyReport, generateTimeInvestmentPdf, MonthlyTimeReport } from '../utils/timeReport';
import { getTodayIso } from '../utils/recurrence';
import { HoursHeader } from '../components/hours/HoursHeader';
import { HoursSubNavTabs, HoursTabType } from '../components/hours/HoursSubNavTabs';
import { MonthYearPickerDialog } from '../components/hours/MonthYearPickerDialog';
import { GoalDetailModal } from '../components/hours/GoalDetailModal';
import { CreateOrEditGoalModal } from '../components/hours/CreateOrEditGoalModal';
import { DailyTimeEntryModal } from '../components/hours/DailyTimeEntryModal';

export const HoursPage: React.FC = () => {
  // Navigation & Month State
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const [activeTab, setActiveTab] = useState<HoursTabType>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Accordion Expand States
  const [isGoalsExpanded, setIsGoalsExpanded] = useState<boolean>(true);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(true);
  const [isExportExpanded, setIsExportExpanded] = useState<boolean>(true);

  // Modals & Sheets
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const [selectedPursuitForDetail, setSelectedPursuitForDetail] = useState<Pursuit | null>(null);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState<boolean>(false);
  const [editingPursuit, setEditingPursuit] = useState<Pursuit | null>(null);
  const [dailyEntryTarget, setDailyEntryTarget] = useState<{
    pursuit: Pursuit;
    dateStr: string;
    existingRecord?: TimeGoalRecord | null;
  } | null>(null);

  // Export PDF Options & State
  const [exportMode, setExportMode] = useState<'single' | 'multiple'>('single');
  const [rangeStartYear, setRangeStartYear] = useState<number>(currentYear);
  const [rangeStartMonth, setRangeStartMonth] = useState<number>(currentMonth);
  const [rangeEndYear, setRangeEndYear] = useState<number>(currentYear);
  const [rangeEndMonth, setRangeEndMonth] = useState<number>(currentMonth);
  const [showStartMonthPicker, setShowStartMonthPicker] = useState<boolean>(false);
  const [showEndMonthPicker, setShowEndMonthPicker] = useState<boolean>(false);

  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeGoalsList, setIncludeGoalsList] = useState(true);
  const [includeCalendarGrid, setIncludeCalendarGrid] = useState(true);
  const [includeTimeDistribution, setIncludeTimeDistribution] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Additional timeline months to load
  const [additionalMonthsToLoad, setAdditionalMonthsToLoad] = useState<number>(0);

  // Time records from database
  const [allRecords, setAllRecords] = useState<TimeGoalRecord[]>([]);

  const {
    pursuits,
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

  // Load records from DB
  const loadRecords = useCallback(async () => {
    try {
      const recs = await db.getAllTimeRecords();
      setAllRecords(recs);
    } catch (err) {
      console.error('Failed to load time records:', err);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    const handleDataChange = () => {
      loadRecords();
    };
    window.addEventListener('nudge-data-changed', handleDataChange);
    return () => window.removeEventListener('nudge-data-changed', handleDataChange);
  }, [loadRecords]);

  // Is viewing the actual current month
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
  const todayIso = getTodayIso();

  // Month navigation handlers
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  };

  // Records for the currently selected month
  const selectedMonthRecords = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return allRecords.filter((r) => r.date && r.date.startsWith(prefix));
  }, [allRecords, selectedYear, selectedMonth]);

  // Monthly Overview Calculations
  const monthlyMetrics = useMemo(() => {
    const totalPlannedHours = pursuits.reduce((acc, p) => acc + p.targetHours, 0);
    const totalInvestedMinutes = selectedMonthRecords.reduce((acc, r) => acc + (r.minutes || 0), 0);
    const totalInvestedHours = totalInvestedMinutes / 60;
    const remainingHours = Math.max(0, totalPlannedHours - totalInvestedHours);
    const percentage =
      totalPlannedHours > 0
        ? Math.min(100, Math.round((totalInvestedHours / totalPlannedHours) * 100))
        : 0;

    return {
      totalPlannedHours,
      totalInvestedHours,
      remainingHours,
      percentage,
    };
  }, [pursuits, selectedMonthRecords]);

  // Format timer
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  // Today label
  const todayFormattedLabel = useMemo(() => {
    return now
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      .toUpperCase();
  }, [now]);

  // Timeline groups for Past Months tab
  const timelineGroups = useMemo(() => {
    const groups: { year: number; months: { year: number; month: number }[] }[] = [];
    const baseYears = [currentYear, currentYear - 1, currentYear - 2];

    baseYears.forEach((yr) => {
      let monthsList: number[] = [];
      if (yr === currentYear) {
        // current month, current - 1, current - 2
        for (let i = 0; i < 3; i++) {
          const m = currentMonth - i;
          if (m >= 1) monthsList.push(m);
        }
      } else {
        monthsList = [12, 11, 10];
      }
      groups.push({
        year: yr,
        months: monthsList.map((m) => ({ year: yr, month: m })),
      });
    });

    if (additionalMonthsToLoad > 0) {
      // Add older months to earlier years
      let curY = currentYear - 2;
      let curM = 9;
      for (let i = 0; i < additionalMonthsToLoad; i++) {
        let yrGroup = groups.find((g) => g.year === curY);
        if (!yrGroup) {
          yrGroup = { year: curY, months: [] };
          groups.push(yrGroup);
        }
        if (!yrGroup.months.some((m) => m.month === curM)) {
          yrGroup.months.push({ year: curY, month: curM });
        }
        curM--;
        if (curM < 1) {
          curM = 12;
          curY--;
        }
      }
    }

    return groups;
  }, [currentYear, currentMonth, additionalMonthsToLoad]);

  // Pre-calculate month stats for past months
  const monthStatsMap = useMemo(() => {
    const map = new Map<string, { totalHours: number; activeDays: number }>();
    allRecords.forEach((r) => {
      if (r.date && /^\d{4}-\d{2}/.test(r.date)) {
        const ym = r.date.substring(0, 7);
        const curr = map.get(ym) || { totalHours: 0, activeDays: 0 };
        curr.totalHours += (r.minutes || 0) / 60;
        map.set(ym, curr);
      }
    });

    // Compute active days
    const daysMap = new Map<string, Set<string>>();
    allRecords.forEach((r) => {
      if (r.date && r.minutes > 0) {
        const ym = r.date.substring(0, 7);
        if (!daysMap.has(ym)) daysMap.set(ym, new Set());
        daysMap.get(ym)!.add(r.date);
      }
    });

    daysMap.forEach((dates, ym) => {
      const curr = map.get(ym) || { totalHours: 0, activeDays: 0 };
      curr.activeDays = dates.size;
      map.set(ym, curr);
    });

    return map;
  }, [allRecords]);

  // Export PDF validation
  const startTotalMonths = rangeStartYear * 12 + rangeStartMonth;
  const endTotalMonths = rangeEndYear * 12 + rangeEndMonth;
  const isRangeInvalid = startTotalMonths > endTotalMonths;
  const rangeMonthsCount = isRangeInvalid ? 0 : endTotalMonths - startTotalMonths + 1;
  const isRangeTooLarge = rangeMonthsCount > 12;
  const canExportPdf = exportMode === 'single' || (!isRangeInvalid && !isRangeTooLarge && rangeMonthsCount > 0);

  // PDF Export Handlers
  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const yr = exportMode === 'single' ? selectedYear : rangeStartYear;
      const mo = exportMode === 'single' ? selectedMonth : rangeStartMonth;
      const report: MonthlyTimeReport = await calculateMonthlyReport(yr, mo);
      const doc = generateTimeInvestmentPdf(report);
      const filename =
        exportMode === 'single'
          ? `Nudge-Time-Report-${yr}-${String(mo).padStart(2, '0')}.pdf`
          : `Nudge-Time-Report-${rangeStartYear}-${String(rangeStartMonth).padStart(2, '0')}-to-${rangeEndYear}-${String(rangeEndMonth).padStart(2, '0')}.pdf`;

      doc.save(filename);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const yr = exportMode === 'single' ? selectedYear : rangeStartYear;
      const mo = exportMode === 'single' ? selectedMonth : rangeStartMonth;
      const report: MonthlyTimeReport = await calculateMonthlyReport(yr, mo);
      const doc = generateTimeInvestmentPdf(report);
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to preview PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Record daily time handler
  const handleSaveDailyTime = async (minutes: number, note?: string) => {
    if (!dailyEntryTarget) return;
    const { pursuit, dateStr } = dailyEntryTarget;
    try {
      await db.addTimeRecord({
        pursuitId: pursuit.id,
        date: dateStr,
        minutes,
        note,
      });

      // Update pursuit logged minutes
      if (dateStr === todayIso && minutes > 0) {
        await addManualHours(pursuit.id, minutes / 60);
      }

      await loadRecords();
      window.dispatchEvent(new Event('nudge-data-changed'));
    } catch (err) {
      console.error('Failed to save daily time:', err);
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto space-y-6 pb-14 sm:pb-10 animate-in fade-in duration-300"
      data-testid="hours_screen"
    >
      {/* 1. Header with Editorial Serif Title & Month Navigator */}
      <HoursHeader
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        isCurrentMonth={isCurrentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onCurrentMonth={handleCurrentMonth}
        onMonthClick={() => setShowMonthPicker(true)}
      />

      {/* 2. Sub-Navigation Tabs matching Android HoursSubNavTabs */}
      <HoursSubNavTabs
        activeTab={activeTab}
        onTabSelected={(tab) => setActiveTab(tab)}
      />

      {/* 3. ACTIVE TRACKING FLOATING BANNER */}
      {activeTimer && (
        <section className="p-4 rounded-3xl bg-blue-600 text-white shadow-md animate-in slide-in-from-top-2 duration-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">
              <span className={activeTimer.isRunning ? 'animate-pulse' : ''}>⏱</span>
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
                  type="button"
                  onClick={pauseTimer}
                  className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="Pause tracking"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="p-2.5 rounded-full bg-white text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Resume tracking"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}
              <button
                type="button"
                onClick={stopTimer}
                className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Save & log hours"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Monthly Summary Card matching MonthlySummaryCard.kt */}
          <section className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-nudge-blue">
                MONTHLY OVERVIEW
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-nudge-blue border border-blue-200/50 dark:border-blue-900/40">
                {monthlyMetrics.percentage}% Achieved
              </span>
            </div>

            {/* 3-Column Metrics: PLANNED, INVESTED, REMAINING */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
                  PLANNED
                </span>
                <p className="text-base sm:text-lg font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
                  {monthlyMetrics.totalPlannedHours}h
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
                  INVESTED
                </span>
                <p className="text-base sm:text-lg font-bold text-nudge-blue mt-0.5">
                  {monthlyMetrics.totalInvestedHours.toFixed(1)}h
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-nudge-text-secondary uppercase tracking-wider">
                  REMAINING
                </span>
                <p className="text-base sm:text-lg font-bold text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                  {monthlyMetrics.remainingHours.toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Gradient Progress Bar */}
            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-nudge-blue rounded-full transition-all duration-500"
                style={{ width: `${monthlyMetrics.percentage}%` }}
              />
            </div>
          </section>

          {/* Today Quick-Entry Section (Shown when viewing current month) */}
          {isCurrentMonth && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <CalendarIcon className="w-4 h-4 text-nudge-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                  TODAY — {todayFormattedLabel}
                </h3>
              </div>

              {pursuits.length === 0 ? (
                <p className="text-xs text-nudge-text-secondary px-1">
                  Add a time goal below to begin tracking today.
                </p>
              ) : (
                <div className="space-y-2">
                  {pursuits.map((p) => {
                    const dailyTargetMins = Math.max(15, Math.round((p.targetHours * 60) / 30));
                    const todayRecs = allRecords.filter(
                      (r) => r.pursuitId === p.id && r.date === todayIso
                    );
                    const loggedMins = todayRecs.reduce((acc, r) => acc + (r.minutes || 0), 0);
                    const isDone = loggedMins >= dailyTargetMins && dailyTargetMins > 0;
                    const remainingMins = Math.max(0, dailyTargetMins - loggedMins);

                    let statusText = `Not Started · ${dailyTargetMins}m remaining`;
                    let statusColor = 'text-nudge-text-muted';
                    if (isDone) {
                      statusText = '✓ Complete';
                      statusColor = 'text-emerald-600 dark:text-emerald-400 font-medium';
                    } else if (loggedMins > 0) {
                      statusText = `Pending · ${remainingMins}m remaining`;
                      statusColor = 'text-amber-600 dark:text-amber-400 font-medium';
                    }

                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs hover:border-nudge-blue/40 transition-all flex items-center justify-between gap-3"
                      >
                        <div
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          onClick={() => {
                            setDailyEntryTarget({
                              pursuit: p,
                              dateStr: todayIso,
                              existingRecord: todayRecs[0] || null,
                            });
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-base shrink-0 border border-blue-100 dark:border-blue-900/40">
                            {p.emoji || '🎯'}
                          </div>
                          <div className="truncate">
                            <h4 className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark truncate">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                              Logged: {loggedMins}m / {dailyTargetMins}m
                            </p>
                            <p className={`text-[10.5px] ${statusColor}`}>
                              {statusText}
                            </p>
                          </div>
                        </div>

                        {/* Quick action buttons matching Android */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {isDone ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/50 dark:border-emerald-800/40">
                              ✓ Target Met
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                title="Add 15 minutes"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await db.addTimeRecord({
                                    pursuitId: p.id,
                                    date: todayIso,
                                    minutes: 15,
                                  });
                                  await addManualHours(p.id, 0.25);
                                  await loadRecords();
                                  window.dispatchEvent(new Event('nudge-data-changed'));
                                }}
                                className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-nudge-blue text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200/40 dark:border-blue-800/30"
                              >
                                +15m
                              </button>

                              <button
                                type="button"
                                title="Add 30 minutes"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await db.addTimeRecord({
                                    pursuitId: p.id,
                                    date: todayIso,
                                    minutes: 30,
                                  });
                                  await addManualHours(p.id, 0.5);
                                  await loadRecords();
                                  window.dispatchEvent(new Event('nudge-data-changed'));
                                }}
                                className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-nudge-blue text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200/40 dark:border-blue-800/30"
                              >
                                +30m
                              </button>

                              <button
                                type="button"
                                title="Add 1 hour"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await db.addTimeRecord({
                                    pursuitId: p.id,
                                    date: todayIso,
                                    minutes: 60,
                                  });
                                  await addManualHours(p.id, 1.0);
                                  await loadRecords();
                                  window.dispatchEvent(new Event('nudge-data-changed'));
                                }}
                                className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-nudge-blue text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200/40 dark:border-blue-800/30"
                              >
                                +1h
                              </button>

                              <button
                                type="button"
                                title="Log full daily target"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const minsToAdd = remainingMins > 0 ? remainingMins : dailyTargetMins;
                                  await db.addTimeRecord({
                                    pursuitId: p.id,
                                    date: todayIso,
                                    minutes: minsToAdd,
                                  });
                                  await addManualHours(p.id, minsToAdd / 60);
                                  await loadRecords();
                                  window.dispatchEvent(new Event('nudge-data-changed'));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-nudge-blue text-[11px] font-bold transition-colors cursor-pointer border border-blue-200/50 dark:border-blue-900/40"
                              >
                                + Full Target
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Time Goals Accordion matching Android MinimalAccordionSection */}
          <div
            className="w-full space-y-2"
            data-testid="time_goals_accordion_container"
          >
            {/* Header Row */}
            <button
              type="button"
              data-testid="time_goals_accordion_header"
              onClick={() => setIsGoalsExpanded((prev) => !prev)}
              aria-expanded={isGoalsExpanded}
              className="w-full flex items-center justify-between py-3 px-1 bg-transparent border-0 cursor-pointer select-none text-left outline-none group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-base flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  🎯
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider text-nudge-text-secondary uppercase">
                    YOUR TIME GOALS
                  </span>
                  <p className="text-xs text-nudge-text-secondary/80">
                    {pursuits.length} Active Pursuit{pursuits.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ease-out ${
                  isGoalsExpanded ? 'rotate-180 text-nudge-blue' : 'rotate-0 text-nudge-text-secondary'
                }`}
              />
            </button>

            {/* Underline Divider with Animated Blue Expand */}
            <div className="relative w-full h-[2px]">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-nudge-border/80 dark:bg-nudge-border-dark/80" />
              <div
                className={`absolute left-0 top-0 h-[2px] w-full bg-nudge-blue origin-left transition-transform duration-350 ease-out ${
                  isGoalsExpanded ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </div>

            {/* Expanded Content */}
            {isGoalsExpanded && (
              <div className="pt-3 space-y-3 animate-in fade-in duration-200">
                {pursuits.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-nudge-blue flex items-center justify-center text-xl mx-auto">
                      ⏳
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                        Your hours are yours to shape.
                      </h4>
                      <p className="text-xs text-nudge-text-secondary max-w-sm mx-auto mt-1">
                        Set meaningful daily pursuits—reading, coding, deep work, or exercise—and manually record the time you invest.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPursuit(null);
                        setIsCreateGoalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-blue text-white hover:bg-nudge-blue-hover transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Your First Pursuit</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pursuits.map((p) => {
                      const pursuitMonthRecs = selectedMonthRecords.filter(
                        (r) => r.pursuitId === p.id
                      );
                      const recordedMins = pursuitMonthRecs.reduce(
                        (acc, r) => acc + (r.minutes || 0),
                        0
                      );
                      const recordedHrs = recordedMins / 60;
                      const pct = Math.min(
                        100,
                        Math.round((recordedHrs / Math.max(1, p.targetHours)) * 100)
                      );
                      const dailyTargetMins = Math.max(
                        15,
                        Math.round((p.targetHours * 60) / 30)
                      );
                      const isCurrentlyTracking =
                        activeTimer && activeTimer.pursuitId === p.id;

                      return (
                        <div
                          key={p.id}
                          className="p-4 rounded-[18px] bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 shadow-2xs hover:border-nudge-blue/40 transition-all space-y-3"
                        >
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                              onClick={() => setSelectedPursuitForDetail(p)}
                            >
                              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-lg flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                                {p.emoji || '🎯'}
                              </div>
                              <div className="truncate">
                                <h4 className="text-sm font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark truncate">
                                  {p.name}
                                </h4>
                                <p className="text-[11.5px] text-nudge-text-secondary">
                                  {dailyTargetMins}m daily target
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-nudge-blue text-xs font-bold border border-blue-200/50">
                                {pct}%
                              </span>

                              {/* Quick Track/Stop */}
                              {isCurrentlyTracking ? (
                                <button
                                  type="button"
                                  onClick={stopTimer}
                                  className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Square className="w-3 h-3" />
                                  <span>Stop</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startTimer(p.id)}
                                  className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-nudge-blue hover:bg-nudge-blue hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-blue-200/50"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Track</span>
                                </button>
                              )}

                              {/* Edit & Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPursuit(p);
                                  setIsCreateGoalOpen(true);
                                }}
                                title="Edit Pursuit"
                                className="p-1 rounded-lg text-nudge-text-muted hover:text-nudge-text-primary transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete pursuit "${p.name}"?`)) {
                                    deletePursuit(p.id);
                                  }
                                }}
                                title="Delete Pursuit"
                                className="p-1 rounded-lg text-nudge-text-muted hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Stats */}
                          <div
                            className="flex items-center justify-between text-xs cursor-pointer"
                            onClick={() => setSelectedPursuitForDetail(p)}
                          >
                            <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                              {recordedHrs.toFixed(1)}h / {p.targetHours}h
                            </span>
                            <span className="text-nudge-blue font-medium hover:underline">
                              Tap to view calendar
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div
                            className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden cursor-pointer"
                            onClick={() => setSelectedPursuitForDetail(p)}
                          >
                            <div
                              className="h-full bg-nudge-blue rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Completion count indicators */}
                          <div className="flex items-center justify-between text-[11px] text-nudge-text-secondary">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ {pursuitMonthRecs.filter((r) => r.minutes >= dailyTargetMins).length} done
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => addManualHours(p.id, 0.5)}
                                className="px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark hover:bg-nudge-blue hover:text-white text-nudge-blue text-[10.5px] font-medium transition-colors cursor-pointer"
                              >
                                +30m
                              </button>
                              <button
                                type="button"
                                onClick={() => addManualHours(p.id, 1.0)}
                                className="px-2 py-0.5 rounded-md bg-nudge-parchment dark:bg-nudge-parchment-dark hover:bg-nudge-blue hover:text-white text-nudge-blue text-[10.5px] font-medium transition-colors cursor-pointer"
                              >
                                +1h
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom Outlined "+ Add Pursuit" Button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        data-testid="btn_add_time_goal"
                        onClick={() => {
                          setEditingPursuit(null);
                          setIsCreateGoalOpen(true);
                        }}
                        className="px-5 py-2 rounded-full border border-nudge-blue text-nudge-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Pursuit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PAST MONTHS ==================== */}
      {activeTab === 'past_months' && (
        <div className="space-y-4">
          <div
            className="w-full space-y-2"
            data-testid="historical_timeline_accordion_container"
          >
            {/* Header Row */}
            <button
              type="button"
              data-testid="historical_timeline_accordion_header"
              onClick={() => setIsTimelineExpanded((prev) => !prev)}
              aria-expanded={isTimelineExpanded}
              className="w-full flex items-center justify-between py-3 px-1 bg-transparent border-0 cursor-pointer select-none text-left outline-none group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-nudge-blue flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-base font-semibold tracking-tight text-nudge-text-primary dark:text-nudge-text-primary-dark">
                    Historical Timeline
                  </span>
                  <p className="text-xs text-nudge-text-secondary">
                    Access all historical months and pursuits data.
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ease-out ${
                  isTimelineExpanded ? 'rotate-180 text-nudge-blue' : 'rotate-0 text-nudge-text-secondary'
                }`}
              />
            </button>

            {/* Underline Divider */}
            <div className="relative w-full h-[2px]">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-nudge-border/80 dark:bg-nudge-border-dark/80" />
              <div
                className={`absolute left-0 top-0 h-[2px] w-full bg-nudge-blue origin-left transition-transform duration-350 ease-out ${
                  isTimelineExpanded ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </div>

            {/* Expanded Content */}
            {isTimelineExpanded && (
              <div className="pt-3 space-y-4 animate-in fade-in duration-200">
                {timelineGroups.map((group) => {
                  const groupTotalHours = group.months.reduce((acc, ym) => {
                    const key = `${ym.year}-${String(ym.month).padStart(2, '0')}`;
                    return acc + (monthStatsMap.get(key)?.totalHours || 0);
                  }, 0);

                  return (
                    <div key={group.year} className="space-y-2.5">
                      {/* Year Section Header */}
                      <div className="flex items-center justify-between px-1 pt-2">
                        <h4 className="text-base font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                          {group.year}
                        </h4>
                        {groupTotalHours > 0 && (
                          <span className="text-xs font-semibold text-nudge-blue">
                            {groupTotalHours.toFixed(1)}h logged in {group.year}
                          </span>
                        )}
                      </div>

                      {/* Month Cards in this Year */}
                      <div className="space-y-2">
                        {group.months.map((ym) => {
                          const isSelected =
                            ym.year === selectedYear && ym.month === selectedMonth;
                          const isCurr =
                            ym.year === currentYear && ym.month === currentMonth;
                          const key = `${ym.year}-${String(ym.month).padStart(2, '0')}`;
                          const stats = monthStatsMap.get(key);
                          const totalHours = stats?.totalHours || 0;
                          const activeDays = stats?.activeDays || 0;

                          const monthName = new Date(ym.year, ym.month - 1, 1).toLocaleString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          });

                          return (
                            <div
                              key={key}
                              onClick={() => {
                                setSelectedYear(ym.year);
                                setSelectedMonth(ym.month);
                                setActiveTab('dashboard');
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-nudge-blue shadow-2xs'
                                  : 'bg-white dark:bg-nudge-card-dark border-nudge-border/80 dark:border-nudge-border-dark/80 hover:border-nudge-blue/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-nudge-blue text-white'
                                      : totalHours > 0
                                      ? 'bg-blue-50 dark:bg-blue-950/50 text-nudge-blue'
                                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                                  }`}
                                >
                                  <CalendarIcon className="w-4 h-4" />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-sm font-bold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                                      {monthName}
                                    </h5>
                                    {isCurr && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-nudge-blue">
                                        Current
                                      </span>
                                    )}
                                    {isSelected && !isCurr && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-nudge-blue">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-nudge-text-secondary mt-0.5">
                                    {totalHours > 0
                                      ? `${totalHours.toFixed(1)}h logged • ${activeDays} active days`
                                      : `${new Date(ym.year, ym.month, 0).getDate()} days • No activity logged`}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className="w-4 h-4 text-nudge-text-muted" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Action Buttons matching Android */}
                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    data-testid="load_older_months_button"
                    onClick={() => setAdditionalMonthsToLoad((prev) => prev + 12)}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-nudge-blue text-white hover:bg-nudge-blue-hover text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>Load older months (+12 mos)</span>
                  </button>

                  <button
                    type="button"
                    data-testid="select_year_button"
                    onClick={() => setShowMonthPicker(true)}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-nudge-blue hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-blue-200/50"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span>Select Year</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: EXPORT PDF ==================== */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <div
            className="w-full space-y-2"
            data-testid="export_pdf_accordion_container"
          >
            {/* Header Row */}
            <button
              type="button"
              data-testid="export_pdf_accordion_header"
              onClick={() => setIsExportExpanded((prev) => !prev)}
              aria-expanded={isExportExpanded}
              className="w-full flex items-center justify-between py-3 px-1 bg-transparent border-0 cursor-pointer select-none text-left outline-none group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-nudge-blue flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-base font-semibold tracking-tight text-nudge-text-primary dark:text-nudge-text-primary-dark">
                    Export PDF
                  </span>
                  <p className="text-xs text-nudge-text-secondary">
                    Create and share your monthly time report.
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ease-out ${
                  isExportExpanded ? 'rotate-180 text-nudge-blue' : 'rotate-0 text-nudge-text-secondary'
                }`}
              />
            </button>

            {/* Underline Divider */}
            <div className="relative w-full h-[2px]">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-nudge-border/80 dark:bg-nudge-border-dark/80" />
              <div
                className={`absolute left-0 top-0 h-[2px] w-full bg-nudge-blue origin-left transition-transform duration-350 ease-out ${
                  isExportExpanded ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </div>

            {/* Expanded Content */}
            {isExportExpanded && (
              <div className="pt-3 space-y-5 animate-in fade-in duration-200">
                {/* Export Mode Toggle: [ Single Month ] [ Multiple Months ] */}
                <div className="flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 max-w-sm">
                  <button
                    type="button"
                    data-testid="tab_export_single_month"
                    onClick={() => setExportMode('single')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      exportMode === 'single'
                        ? 'bg-white dark:bg-nudge-card-dark text-nudge-text-primary dark:text-nudge-text-primary-dark shadow-2xs'
                        : 'text-nudge-text-secondary hover:text-nudge-text-primary'
                    }`}
                  >
                    Single Month
                  </button>
                  <button
                    type="button"
                    data-testid="tab_export_multiple_months"
                    onClick={() => setExportMode('multiple')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      exportMode === 'multiple'
                        ? 'bg-white dark:bg-nudge-card-dark text-nudge-text-primary dark:text-nudge-text-primary-dark shadow-2xs'
                        : 'text-nudge-text-secondary hover:text-nudge-text-primary'
                    }`}
                  >
                    Multiple Months
                  </button>
                </div>

                {/* Mode Sub-headers */}
                {exportMode === 'single' ? (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-nudge-blue">
                      EXPORT TIME REPORT (PDF)
                    </span>
                    <h3 className="font-editorial-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
                      Generate{' '}
                      {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      Report
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nudge-blue">
                        EXPORT TIME REPORT (PDF)
                      </span>
                      <h3 className="font-editorial-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
                        Generate Multi-Month Report
                      </h3>
                    </div>

                    {/* SELECT MONTH RANGE Card */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 space-y-3">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-nudge-text-secondary">
                        SELECT MONTH RANGE
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Start Month Button */}
                        <button
                          type="button"
                          data-testid="btn_range_start_month"
                          onClick={() => setShowStartMonthPicker(true)}
                          className="flex-1 py-2 px-3 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/40 dark:bg-neutral-800/40 text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark flex items-center justify-center gap-1.5 cursor-pointer hover:border-nudge-blue"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-nudge-blue" />
                          <span>
                            {new Date(rangeStartYear, rangeStartMonth - 1, 1).toLocaleString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </button>

                        <span className="text-sm font-bold text-nudge-text-muted">—</span>

                        {/* End Month Button */}
                        <button
                          type="button"
                          data-testid="btn_range_end_month"
                          onClick={() => setShowEndMonthPicker(true)}
                          className="flex-1 py-2 px-3 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-nudge-parchment/40 dark:bg-neutral-800/40 text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark flex items-center justify-center gap-1.5 cursor-pointer hover:border-nudge-blue"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-nudge-blue" />
                          <span>
                            {new Date(rangeEndYear, rangeEndMonth - 1, 1).toLocaleString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </button>
                      </div>

                      {/* Validation & Status */}
                      {isRangeInvalid ? (
                        <p
                          data-testid="txt_range_validation_error"
                          className="text-xs text-red-500 font-medium"
                        >
                          Start month must precede end month
                        </p>
                      ) : isRangeTooLarge ? (
                        <p
                          data-testid="txt_range_validation_error"
                          className="text-xs text-red-500 font-medium"
                        >
                          You can select up to 12 months at a time.
                        </p>
                      ) : (
                        <div>
                          <p
                            data-testid="txt_range_months_count"
                            className="text-xs font-semibold text-nudge-blue"
                          >
                            {rangeMonthsCount} {rangeMonthsCount === 1 ? 'month' : 'months'} selected
                          </p>
                          <p
                            data-testid="txt_range_label"
                            className="text-xs text-nudge-text-secondary mt-0.5"
                          >
                            {new Date(rangeStartYear, rangeStartMonth - 1, 1).toLocaleString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}{' '}
                            –{' '}
                            {new Date(rangeEndYear, rangeEndMonth - 1, 1).toLocaleString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DOCUMENT SECTIONS TO INCLUDE Card */}
                <div className="p-5 rounded-[20px] bg-white dark:bg-nudge-card-dark border border-nudge-border/80 dark:border-nudge-border-dark/80 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-nudge-text-secondary">
                    DOCUMENT SECTIONS TO INCLUDE
                  </span>

                  <div className="divide-y divide-nudge-border/50 dark:divide-nudge-border-dark/50 text-sm">
                    {[
                      {
                        label: 'Monthly Hours Summary',
                        checked: includeSummary,
                        toggle: () => setIncludeSummary((v) => !v),
                      },
                      {
                        label: 'Goals & Daily Targets',
                        checked: includeGoalsList,
                        toggle: () => setIncludeGoalsList((v) => !v),
                      },
                      {
                        label: 'Monthly Calendar Grid',
                        checked: includeCalendarGrid,
                        toggle: () => setIncludeCalendarGrid((v) => !v),
                      },
                      {
                        label: 'Time Distribution',
                        checked: includeTimeDistribution,
                        toggle: () => setIncludeTimeDistribution((v) => !v),
                      },
                      {
                        label: 'Review Insights & Streaks',
                        checked: includeInsights,
                        toggle: () => setIncludeInsights((v) => !v),
                      },
                    ].map((opt, i) => (
                      <div
                        key={i}
                        onClick={opt.toggle}
                        className="py-3 flex items-center justify-between cursor-pointer group"
                      >
                        <span className="font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark">
                          {opt.label}
                        </span>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center">
                          {opt.checked ? (
                            <span className="text-base font-bold text-nudge-blue">✓</span>
                          ) : (
                            <span className="text-lg text-nudge-text-muted/60 group-hover:text-nudge-text-muted">
                              +
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button matching Android Soft Blue Tint Design */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    data-testid="btn_generate_hours_pdf"
                    disabled={!canExportPdf || isGeneratingPdf}
                    onClick={handleExportPdf}
                    className="w-full h-14 rounded-[20px] bg-[#EFF6FF] dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#1E3A8A] dark:text-blue-200 text-base font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-[#1E3A8A] dark:border-blue-200 border-t-transparent animate-spin" />
                        <span>Generating Report...</span>
                      </>
                    ) : pdfSuccess ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span>PDF Report Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 text-[#1E3A8A] dark:text-blue-200" />
                        <span>
                          {exportMode === 'multiple' && rangeMonthsCount > 1
                            ? `Generate & Share PDF (${rangeMonthsCount} Months)`
                            : 'Generate & Share PDF'}
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={handlePreviewPdf}
                      className="text-xs text-nudge-text-secondary hover:text-nudge-blue transition-colors inline-flex items-center gap-1 cursor-pointer py-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview PDF in new tab</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== DIALOGS & MODALS ==================== */}

      {/* Month Year Picker Dialog */}
      <MonthYearPickerDialog
        isOpen={showMonthPicker}
        currentYear={selectedYear}
        currentMonth={selectedMonth}
        onDismiss={() => setShowMonthPicker(false)}
        onSelectMonthYear={(yr, mo) => {
          setSelectedYear(yr);
          setSelectedMonth(mo);
        }}
      />

      {/* Range Start Month Picker */}
      <MonthYearPickerDialog
        isOpen={showStartMonthPicker}
        currentYear={rangeStartYear}
        currentMonth={rangeStartMonth}
        onDismiss={() => setShowStartMonthPicker(false)}
        onSelectMonthYear={(yr, mo) => {
          setRangeStartYear(yr);
          setRangeStartMonth(mo);
        }}
      />

      {/* Range End Month Picker */}
      <MonthYearPickerDialog
        isOpen={showEndMonthPicker}
        currentYear={rangeEndYear}
        currentMonth={rangeEndMonth}
        onDismiss={() => setShowEndMonthPicker(false)}
        onSelectMonthYear={(yr, mo) => {
          setRangeEndYear(yr);
          setRangeEndMonth(mo);
        }}
      />

      {/* Goal Detail Modal (Calendar Sheet) */}
      {selectedPursuitForDetail && (
        <GoalDetailModal
          isOpen={true}
          pursuit={selectedPursuitForDetail}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          records={selectedMonthRecords}
          onDismiss={() => setSelectedPursuitForDetail(null)}
          onEdit={() => {
            const p = selectedPursuitForDetail;
            setSelectedPursuitForDetail(null);
            setEditingPursuit(p);
            setIsCreateGoalOpen(true);
          }}
          onDelete={async () => {
            await deletePursuit(selectedPursuitForDetail.id);
            setSelectedPursuitForDetail(null);
            await loadRecords();
            window.dispatchEvent(new Event('nudge-data-changed'));
          }}
          onDayClick={(dateIso, existingRec) => {
            setDailyEntryTarget({
              pursuit: selectedPursuitForDetail,
              dateStr: dateIso,
              existingRecord: existingRec || null,
            });
          }}
          onPrevMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
      )}

      {/* Create / Edit Goal Modal */}
      <CreateOrEditGoalModal
        isOpen={isCreateGoalOpen}
        goalToEdit={editingPursuit}
        onDismiss={() => {
          setIsCreateGoalOpen(false);
          setEditingPursuit(null);
        }}
        onSave={async (data) => {
          if (editingPursuit) {
            await editPursuit({
              ...editingPursuit,
              name: data.name,
              targetHours: data.targetHours,
              emoji: data.emoji,
            });
          } else {
            await createPursuit({
              name: data.name,
              targetHours: data.targetHours,
              emoji: data.emoji,
            });
          }
          await loadRecords();
          window.dispatchEvent(new Event('nudge-data-changed'));
        }}
      />

      {/* Daily Time Entry Modal */}
      {dailyEntryTarget && (
        <DailyTimeEntryModal
          isOpen={true}
          pursuit={dailyEntryTarget.pursuit}
          dateStr={dailyEntryTarget.dateStr}
          existingRecord={dailyEntryTarget.existingRecord}
          onDismiss={() => setDailyEntryTarget(null)}
          onSave={handleSaveDailyTime}
        />
      )}
    </div>
  );
};
