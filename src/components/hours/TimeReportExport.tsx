import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import {
  calculateMonthlyReport,
  generateTimeInvestmentPdf,
  MonthlyTimeReport,
} from '../../utils/timeReport';
import { getAllTimeRecords } from '../../db/nudgeDb';

interface TimeReportExportProps {
  initialYear?: number;
  initialMonth?: number;
  onBackToDashboard?: () => void;
}

interface AvailableMonth {
  year: number;
  month: number;
  key: string;
  shortLabel: string;
  fullLabel: string;
}

export const TimeReportExport: React.FC<TimeReportExportProps> = ({
  initialYear,
  initialMonth,
  onBackToDashboard,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear !== undefined ? initialYear : currentDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialMonth !== undefined ? initialMonth : currentDate.getMonth() + 1
  );

  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [report, setReport] = useState<MonthlyTimeReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Sync if initialYear / initialMonth props change from parent
  useEffect(() => {
    if (initialYear !== undefined) {
      setSelectedYear(initialYear);
    }
  }, [initialYear]);

  useEffect(() => {
    if (initialMonth !== undefined) {
      setSelectedMonth(initialMonth);
    }
  }, [initialMonth]);

  // Discover real recorded months dynamically from STORE_TIME_RECORDS
  useEffect(() => {
    let isCancelled = false;
    const loadAvailableMonths = async () => {
      try {
        const records = await getAllTimeRecords();
        const monthMap = new Map<string, { year: number; month: number }>();

        const now = new Date();
        const currY = now.getFullYear();
        const currM = now.getMonth() + 1;

        // Current month is always available
        const currentKey = `${currY}-${String(currM).padStart(2, '0')}`;
        monthMap.set(currentKey, { year: currY, month: currM });

        // Add real historical months found in records
        for (const rec of records) {
          if (rec.date && /^\d{4}-\d{2}/.test(rec.date)) {
            const [yStr, mStr] = rec.date.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10);
            if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
              // Exclude future months
              if (y < currY || (y === currY && m <= currM)) {
                const key = `${y}-${String(m).padStart(2, '0')}`;
                if (!monthMap.has(key)) {
                  monthMap.set(key, { year: y, month: m });
                }
              }
            }
          }
        }

        const shortMonthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const fullMonthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];

        const sorted = Array.from(monthMap.entries())
          .map(([key, val]) => ({
            key,
            year: val.year,
            month: val.month,
            shortLabel: `${shortMonthNames[val.month - 1]} ${val.year}`,
            fullLabel: `${fullMonthNames[val.month - 1]} ${val.year}`,
          }))
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });

        if (!isCancelled) {
          setAvailableMonths(sorted);
        }
      } catch (err) {
        console.error('Failed to load available months from time records:', err);
      }
    };

    loadAvailableMonths();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Month options (1-12)
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    new Set([
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      selectedYear,
    ])
  ).sort((a, b) => a - b);

  // Fetch report data when month/year changes
  useEffect(() => {
    let isCancelled = false;
    const loadReport = async () => {
      setIsLoading(true);
      setDownloadSuccess(false);
      try {
        const data = await calculateMonthlyReport(selectedYear, selectedMonth);
        if (!isCancelled) {
          setReport(data);
        }
      } catch (err) {
        console.error('Failed to calculate report:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReport();
    return () => {
      isCancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsGenerating(true);
    try {
      const doc = generateTimeInvestmentPdf(report);
      const filename = `Nudge-Time-Report-${report.year}-${String(report.month).padStart(2, '0')}.pdf`;
      doc.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!report) return;
    setIsGenerating(true);
    try {
      const doc = generateTimeInvestmentPdf(report);
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to preview PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const isCurrentMonth =
    selectedYear === currentDate.getFullYear() &&
    selectedMonth === currentDate.getMonth() + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 sm:pb-8 animate-in fade-in duration-300">
      {/* Top Banner / Explainer */}
      <section className="rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-nudge-blue/10 dark:bg-nudge-blue/20 text-nudge-blue flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial-serif text-xl sm:text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
                Monthly Review & Export
              </h2>
              <p className="text-xs sm:text-sm text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Review any mindful cycle and export a clean, printable A4 audit of your hours, streaks, and goal consistency.
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="text-xs font-medium text-nudge-blue hover:text-nudge-blue-light transition-colors self-start sm:self-center shrink-0"
            >
              ← Back to Current Cycle
            </button>
          )}
        </div>

        {/* Unified Month & Year Selection Bar */}
        <div className="pt-3 border-t border-nudge-border/60 dark:border-nudge-border-dark/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Unified Navigator Pill */}
            <div className="inline-flex items-center rounded-xl bg-nudge-parchment/80 dark:bg-nudge-parchment-dark/80 border border-nudge-border/80 dark:border-nudge-border-dark/80 p-0.5 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-nudge-card-dark text-nudge-text-secondary hover:text-nudge-text-primary transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 py-0.5">
                <Calendar className="w-3.5 h-3.5 text-nudge-blue shrink-0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none cursor-pointer"
                  aria-label="Select month"
                >
                  {monthNames.map((name, i) => (
                    <option key={name} value={i + 1} className="dark:bg-nudge-card-dark">
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none cursor-pointer border-l border-nudge-border/60 dark:border-nudge-border-dark/60 pl-1.5 ml-1"
                  aria-label="Select year"
                >
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr} className="dark:bg-nudge-card-dark">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-nudge-card-dark text-nudge-text-secondary hover:text-nudge-text-primary transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isCurrentMonth && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-nudge-blue border border-blue-200/50 dark:border-blue-800/40 shrink-0">
                Current Cycle
              </span>
            )}
          </div>

          {/* Dynamic Historical Month Quick Access from real STORE_TIME_RECORDS */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-1 max-w-full">
              <span className="text-[11px] text-nudge-text-muted shrink-0 mr-0.5">
                Recorded:
              </span>
              {availableMonths.map((m, idx) => {
                const isMatch = selectedYear === m.year && selectedMonth === m.month;
                const isNewest = idx === 0;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setSelectedYear(m.year);
                      setSelectedMonth(m.month);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 text-xs flex items-center gap-1 ${
                      isMatch
                        ? 'bg-nudge-blue text-white font-medium shadow-2xs'
                        : 'text-nudge-text-secondary hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark'
                    }`}
                  >
                    <span>{m.shortLabel}</span>
                    {isNewest && !isMatch && (
                      <span className="w-1.5 h-1.5 rounded-full bg-nudge-blue" title="Latest cycle" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-nudge-blue border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-nudge-text-secondary">
            Aggregating monthly time logs and activity...
          </p>
        </div>
      )}

      {/* REPORT PREVIEW CARD */}
      {!isLoading && report && (
        <section className="rounded-3xl bg-white dark:bg-nudge-card-dark border border-nudge-border dark:border-nudge-border-dark p-5 sm:p-7 shadow-xs space-y-6">
          {/* Header row: Month Overview on left, PDF actions on right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-nudge-border/60 dark:border-nudge-border-dark/60">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-nudge-blue">
                Month Overview
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark mt-0.5">
                {report.monthName} {report.year}
              </h3>
              <p className="text-xs text-nudge-text-secondary dark:text-nudge-text-secondary-dark mt-0.5">
                Mindful investment summary and verified consistency audit.
              </p>
            </div>

            {/* Action buttons: Download PDF (primary) & Preview Tab (secondary) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-nudge-border dark:border-nudge-border-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary transition-colors disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Tab</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-blue hover:bg-nudge-blue-hover text-white shadow-xs transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Total Invested
              </span>
              <p className="font-editorial-serif text-2xl sm:text-3xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {report.totalInvestedHours.toFixed(1)} hrs
              </p>
              <p className="text-[10px] text-nudge-text-muted">
                across {report.pursuits.length} pursuits
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Monthly Goal
              </span>
              <p className="font-editorial-serif text-2xl sm:text-3xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {report.overallGoalProgress}%
              </p>
              <p className="text-[10px] text-nudge-text-muted">
                {report.totalInvestedHours.toFixed(1)} of {report.totalTargetHours} target hrs
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Active Days
              </span>
              <p className="font-editorial-serif text-2xl sm:text-3xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
                {report.activeDays} / {report.elapsedDays || report.totalDaysInMonth}
              </p>
              <p className="text-[10px] text-nudge-text-muted">
                {report.missedDays} missed / rest days
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/70 dark:border-nudge-border-dark/70 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
                Streak Peak
              </span>
              <p className="font-editorial-serif text-2xl sm:text-3xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark flex items-baseline gap-1">
                <span>{report.longestStreak}</span>
                <span className="text-xs font-normal text-nudge-text-secondary">days</span>
              </p>
              <p className="text-[10px] text-nudge-text-muted">
                Current: {report.currentStreak} days
              </p>
            </div>
          </div>

          {/* Planned vs Invested summary preview */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-nudge-text-secondary dark:text-nudge-text-secondary-dark">
              Pursuit Breakdown
            </h4>

            {report.pursuits.length === 0 ? (
              <p className="text-xs text-nudge-text-muted py-2">
                No active pursuits configured.
              </p>
            ) : (
              <div className="divide-y divide-nudge-border/50 dark:divide-nudge-border-dark/50 border border-nudge-border/70 dark:border-nudge-border-dark/70 rounded-2xl overflow-hidden bg-white dark:bg-nudge-card-dark">
                {report.pursuits.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base select-none shrink-0">{p.emoji}</span>
                      <div className="truncate">
                        <p className="font-medium text-nudge-text-primary dark:text-nudge-text-primary-dark truncate">
                          {p.name}
                        </p>
                        <span className="text-[10px] text-nudge-text-muted">
                          Planned: {p.targetHours}h • Share: {p.sharePercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
                          {p.investedHours.toFixed(1)} hrs
                        </span>
                        <p className="text-[10px] text-nudge-text-muted">
                          {p.percentage}% target
                        </p>
                      </div>

                      <div className="w-16 h-1.5 bg-nudge-parchment dark:bg-nudge-parchment-dark rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-nudge-blue rounded-full"
                          style={{ width: `${Math.min(p.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Insights Preview */}
          <div className="p-4 rounded-2xl bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-nudge-blue flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Insights & Observations</span>
            </h4>
            <ul className="space-y-1 text-xs text-nudge-text-primary dark:text-nudge-text-primary-dark">
              {report.insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-nudge-blue font-bold">•</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Action Row for comfortable accessibility on mobile & desktop */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-nudge-border/60 dark:border-nudge-border-dark/60">
            <button
              type="button"
              onClick={handlePreviewPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-nudge-border dark:border-nudge-border-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-secondary dark:text-nudge-text-secondary-dark hover:text-nudge-text-primary transition-colors disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Tab</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-nudge-blue hover:bg-nudge-blue-hover text-white shadow-xs transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
