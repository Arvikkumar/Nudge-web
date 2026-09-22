import { jsPDF } from 'jspdf';
import { Pursuit, TimeGoalRecord } from '../types';
import * as db from '../db/nudgeDb';

export interface PursuitReportItem {
  id: number;
  name: string;
  emoji: string;
  targetHours: number;
  investedMinutes: number;
  investedHours: number;
  percentage: number;
  varianceHours: number;
  isGoalMet: boolean;
  sharePercentage: number;
}

export interface DayActivity {
  day: number;
  dateIso: string;
  minutes: number;
  hours: number;
  isActive: boolean;
  pursuitMinutes: Record<number, number>;
}

export interface MonthlyTimeReport {
  year: number;
  month: number; // 1-12
  monthName: string;
  totalDaysInMonth: number;
  elapsedDays: number;
  totalInvestedMinutes: number;
  totalInvestedHours: number;
  totalTargetHours: number;
  overallGoalProgress: number;
  activeDays: number;
  missedDays: number;
  currentStreak: number;
  longestStreak: number;
  consistencyPercentage: number;
  mostProductiveDay: {
    day: number;
    dateIso: string;
    hours: number;
  } | null;
  mostInvestedPursuit: {
    name: string;
    emoji: string;
    hours: number;
    sharePercentage: number;
  } | null;
  pursuits: PursuitReportItem[];
  dailyActivity: DayActivity[];
  insights: string[];
}

/**
 * Calculates all metrics and structured data for a selected month report
 */
export async function calculateMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyTimeReport> {
  const [pursuitsList, timeRecords] = await Promise.all([
    db.getAllPursuits(),
    db.getTimeRecordsForMonth(year, month),
  ]);

  const monthDate = new Date(year, month - 1, 1);
  const monthName = monthDate.toLocaleString('en-US', { month: 'long' });
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;
  const isPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);

  const currentDay = now.getDate();
  const elapsedDays = isPastMonth
    ? totalDaysInMonth
    : isCurrentMonth
    ? Math.min(currentDay, totalDaysInMonth)
    : 0;

  // Aggregate daily records
  const dayActivityMap: Record<number, DayActivity> = {};
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dayIso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dayActivityMap[d] = {
      day: d,
      dateIso: dayIso,
      minutes: 0,
      hours: 0,
      isActive: false,
      pursuitMinutes: {},
    };
  }

  // Aggregate pursuit minutes in this month
  const pursuitMinutesMap: Record<number, number> = {};
  timeRecords.forEach((record) => {
    const dayNum = parseInt(record.date.split('-')[2], 10);
    if (dayActivityMap[dayNum]) {
      dayActivityMap[dayNum].minutes += record.minutes;
      dayActivityMap[dayNum].pursuitMinutes[record.pursuitId] =
        (dayActivityMap[dayNum].pursuitMinutes[record.pursuitId] || 0) + record.minutes;
    }
    pursuitMinutesMap[record.pursuitId] =
      (pursuitMinutesMap[record.pursuitId] || 0) + record.minutes;
  });

  // Calculate day states and active days
  let activeDays = 0;
  let maxDayMinutes = 0;
  let mostProductiveDayNum: number | null = null;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const act = dayActivityMap[d];
    act.hours = Math.round((act.minutes / 60) * 10) / 10;
    act.isActive = act.minutes > 0;
    if (act.isActive) {
      activeDays++;
      if (act.minutes > maxDayMinutes) {
        maxDayMinutes = act.minutes;
        mostProductiveDayNum = d;
      }
    }
  }

  // Streaks
  let longestStreak = 0;
  let currentRun = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    if (dayActivityMap[d].isActive) {
      currentRun++;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    } else {
      currentRun = 0;
    }
  }

  let currentStreak = 0;
  if (isCurrentMonth) {
    let startD = elapsedDays;
    if (startD >= 1 && !dayActivityMap[startD].isActive && startD > 1 && dayActivityMap[startD - 1].isActive) {
      startD = startD - 1;
    }
    for (let d = startD; d >= 1; d--) {
      if (dayActivityMap[d].isActive) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (isPastMonth) {
    for (let d = totalDaysInMonth; d >= 1; d--) {
      if (dayActivityMap[d].isActive) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const missedDays = isPastMonth
    ? Math.max(0, totalDaysInMonth - activeDays)
    : isCurrentMonth
    ? Math.max(0, elapsedDays - activeDays)
    : 0;

  const consistencyPercentage =
    elapsedDays > 0 ? Math.round((activeDays / elapsedDays) * 100) : 0;

  const totalInvestedMinutes = Object.values(pursuitMinutesMap).reduce(
    (acc, m) => acc + m,
    0
  );
  const totalInvestedHours = Math.round((totalInvestedMinutes / 60) * 10) / 10;

  const totalTargetHours = pursuitsList.reduce(
    (acc, p) => acc + (p.targetHours || 0),
    0
  );

  const overallGoalProgress =
    totalTargetHours > 0
      ? Math.round((totalInvestedHours / totalTargetHours) * 100)
      : 0;

  // Build pursuits items
  const pursuitReportItems: PursuitReportItem[] = pursuitsList.map((p) => {
    const invMinutes = pursuitMinutesMap[p.id] || 0;
    const invHours = Math.round((invMinutes / 60) * 10) / 10;
    const target = p.targetHours || 0;
    const pct = target > 0 ? Math.round((invHours / target) * 100) : 0;
    const variance = Math.round((invHours - target) * 10) / 10;
    const share =
      totalInvestedMinutes > 0
        ? Math.round((invMinutes / totalInvestedMinutes) * 100)
        : 0;

    return {
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      targetHours: target,
      investedMinutes: invMinutes,
      investedHours: invHours,
      percentage: pct,
      varianceHours: variance,
      isGoalMet: target > 0 && invHours >= target,
      sharePercentage: share,
    };
  });

  // Sort pursuits by invested time descending
  pursuitReportItems.sort((a, b) => b.investedHours - a.investedHours);

  // Most invested pursuit
  const topPursuit =
    pursuitReportItems.length > 0 && pursuitReportItems[0].investedHours > 0
      ? pursuitReportItems[0]
      : null;

  const mostInvestedPursuit = topPursuit
    ? {
        name: topPursuit.name,
        emoji: topPursuit.emoji,
        hours: topPursuit.investedHours,
        sharePercentage: topPursuit.sharePercentage,
      }
    : null;

  // Most productive day
  const mostProductiveDay =
    mostProductiveDayNum !== null && maxDayMinutes > 0
      ? {
          day: mostProductiveDayNum,
          dateIso: dayActivityMap[mostProductiveDayNum].dateIso,
          hours: Math.round((maxDayMinutes / 60) * 10) / 10,
        }
      : null;

  // Generate Insights
  const insights: string[] = [];

  if (totalInvestedHours === 0) {
    insights.push(
      `No hours were recorded for ${monthName} ${year}. A gentle reminder that every small 15-minute intention begins a meaningful rhythm.`
    );
    insights.push(
      `You currently have ${pursuitsList.length} active pursuits waiting for your focus whenever you are ready.`
    );
  } else {
    if (mostInvestedPursuit) {
      insights.push(
        `${mostInvestedPursuit.name} was your most invested pursuit, representing ${mostInvestedPursuit.hours} hours (${mostInvestedPursuit.sharePercentage}% of total time).`
      );
    }

    if (mostProductiveDay) {
      insights.push(
        `${monthName} ${mostProductiveDay.day} was your most productive day, with ${mostProductiveDay.hours} hours logged.`
      );
    }

    if (totalTargetHours > 0) {
      if (overallGoalProgress >= 100) {
        insights.push(
          `Monthly target surpassed! You achieved ${overallGoalProgress}% of your intended focus (${totalInvestedHours} of ${totalTargetHours} target hours).`
        );
      } else {
        insights.push(
          `Monthly goal progress reached ${overallGoalProgress}% (${totalInvestedHours} of ${totalTargetHours} planned hours).`
        );
      }
    }

    if (consistencyPercentage > 0) {
      insights.push(
        `Maintained an active consistency of ${consistencyPercentage}% (${activeDays} active days out of ${elapsedDays} elapsed), with a longest continuous streak of ${longestStreak} days.`
      );
    }
  }

  return {
    year,
    month,
    monthName,
    totalDaysInMonth,
    elapsedDays,
    totalInvestedMinutes,
    totalInvestedHours,
    totalTargetHours,
    overallGoalProgress,
    activeDays,
    missedDays,
    currentStreak,
    longestStreak,
    consistencyPercentage,
    mostProductiveDay,
    mostInvestedPursuit,
    pursuits: pursuitReportItems,
    dailyActivity: Object.values(dayActivityMap),
    insights,
  };
}

/**
 * Creates and formats the professional A4 PDF document using jsPDF
 */
export function generateTimeInvestmentPdf(report: MonthlyTimeReport): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const printableWidth = pageWidth - marginX * 2; // 182mm

  // Colors
  const COLOR_NAVY: [number, number, number] = [43, 92, 143]; // #2B5C8F
  const COLOR_NAVY_LIGHT: [number, number, number] = [235, 243, 250]; // #EBF3FA
  const COLOR_TEXT_PRIMARY: [number, number, number] = [30, 41, 59]; // #1E293B
  const COLOR_TEXT_SECONDARY: [number, number, number] = [100, 116, 139]; // #64748B
  const COLOR_CARD_BG: [number, number, number] = [248, 250, 252]; // #F8FAFC
  const COLOR_BORDER: [number, number, number] = [226, 232, 240]; // #E2E8F0
  const COLOR_EMERALD: [number, number, number] = [16, 185, 129];
  const COLOR_EMERALD_BG: [number, number, number] = [236, 253, 245];
  const COLOR_AMBER: [number, number, number] = [217, 119, 6];

  let currentY = 14;

  // ================= 1. HEADER SECTION =================
  // Eyebrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('NUDGE  •  MINDFUL TIME & FOCUS REPORT', marginX, currentY);

  // Date on right
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_TEXT_SECONDARY);
  doc.text(`Generated on ${dateFormatted}`, pageWidth - marginX, currentY, {
    align: 'right',
  });

  currentY += 6;

  // Main Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLOR_TEXT_PRIMARY);
  doc.text('Time Investment Report', marginX, currentY);

  currentY += 5.5;

  // Selected Month and Year subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEXT_SECONDARY);
  doc.text(
    `Monthly Review & Pursuit Analytics  —  ${report.monthName} ${report.year}`,
    marginX,
    currentY
  );

  currentY += 4.5;

  // Divider line
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 5;

  // ================= 2. KEY METRICS SUMMARY CARDS =================
  const numCards = 4;
  const cardGap = 3.5;
  const cardWidth = (printableWidth - cardGap * (numCards - 1)) / numCards; // ~43mm
  const cardHeight = 21;

  const metricsData = [
    {
      label: 'TOTAL INVESTED',
      value: `${report.totalInvestedHours.toFixed(1)} hrs`,
      sub: `${report.pursuits.length} mindful pursuit${report.pursuits.length === 1 ? '' : 's'}`,
    },
    {
      label: 'MONTHLY GOAL',
      value: `${report.overallGoalProgress}%`,
      sub: `${report.totalInvestedHours.toFixed(1)} of ${report.totalTargetHours} target hrs`,
    },
    {
      label: 'ACTIVE DAYS',
      value: `${report.activeDays} / ${report.elapsedDays || report.totalDaysInMonth}`,
      sub: `${report.missedDays} missed / rest days`,
    },
    {
      label: 'CURRENT STREAK',
      value: `${report.currentStreak} day${report.currentStreak === 1 ? '' : 's'}`,
      sub: `Longest streak: ${report.longestStreak} days`,
    },
  ];

  metricsData.forEach((metric, idx) => {
    const cardX = marginX + idx * (cardWidth + cardGap);

    // Card background
    doc.setFillColor(...COLOR_CARD_BG);
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_TEXT_SECONDARY);
    doc.text(metric.label, cardX + 3.5, currentY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_TEXT_PRIMARY);
    doc.text(metric.value, cardX + 3.5, currentY + 11.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_TEXT_SECONDARY);
    doc.text(metric.sub, cardX + 3.5, currentY + 17);
  });

  currentY += cardHeight + 6;

  // ================= 3. MONTHLY ACTIVITY CALENDAR =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('MONTHLY ACTIVITY CALENDAR', marginX, currentY);

  // Legend on right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_TEXT_SECONDARY);
  doc.text(
    '● Active Day (Time Logged)    ○ Rest / Inactive Day',
    pageWidth - marginX,
    currentY,
    { align: 'right' }
  );

  currentY += 3.5;

  // Calendar setup: Monday first
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const calWidth = printableWidth;
  const colWidth = calWidth / 7;
  const headerHeight = 5;
  const dayRowHeight = 6.2;

  // Days of week header
  doc.setFillColor(...COLOR_CARD_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.15);
  doc.rect(marginX, currentY, calWidth, headerHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_TEXT_SECONDARY);
  dayNames.forEach((name, i) => {
    doc.text(name, marginX + i * colWidth + colWidth / 2, currentY + 3.5, {
      align: 'center',
    });
  });

  currentY += headerHeight;

  // First day offset (Monday = 0)
  const firstDay = new Date(report.year, report.month - 1, 1);
  const firstDow = firstDay.getDay(); // 0 is Sunday
  const startCol = (firstDow + 6) % 7; // Mon=0 .. Sun=6

  let cellCol = startCol;
  let cellY = currentY;

  // Pre-fill empty days before 1st
  for (let empty = 0; empty < startCol; empty++) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.15);
    doc.rect(marginX + empty * colWidth, cellY, colWidth, dayRowHeight, 'FD');
  }

  // Draw day cells
  for (let d = 1; d <= report.totalDaysInMonth; d++) {
    const cellX = marginX + cellCol * colWidth;
    const act = report.dailyActivity[d - 1];

    if (act && act.isActive) {
      doc.setFillColor(...COLOR_NAVY_LIGHT);
      doc.setDrawColor(...COLOR_NAVY);
      doc.setLineWidth(0.2);
      doc.rect(cellX, cellY, colWidth, dayRowHeight, 'FD');

      // Day number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_NAVY);
      doc.text(String(d), cellX + 2, cellY + 4.2);

      // Hours tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...COLOR_NAVY);
      doc.text(`${act.hours}h`, cellX + colWidth - 2, cellY + 4.2, {
        align: 'right',
      });
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.15);
      doc.rect(cellX, cellY, colWidth, dayRowHeight, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_TEXT_SECONDARY);
      doc.text(String(d), cellX + 2, cellY + 4.2);
    }

    cellCol++;
    if (cellCol === 7) {
      cellCol = 0;
      cellY += dayRowHeight;
    }
  }

  // Fill remaining empty cells in final row if needed
  if (cellCol > 0) {
    while (cellCol < 7) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.15);
      doc.rect(marginX + cellCol * colWidth, cellY, colWidth, dayRowHeight, 'FD');
      cellCol++;
    }
    cellY += dayRowHeight;
  }

  currentY = cellY + 6;

  // ================= 4. PURSUITS: PLANNED VS. INVESTED TABLE =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('PURSUITS & TIME GOALS: PLANNED VS. INVESTED', marginX, currentY);

  currentY += 3.5;

  // Table header
  const tableH = 5.5;
  doc.setFillColor(...COLOR_CARD_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(marginX, currentY, printableWidth, tableH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_TEXT_SECONDARY);

  // Column positions
  const cNameX = marginX + 3;
  const cPlannedX = marginX + 70;
  const cInvestedX = marginX + 96;
  const cProgressX = marginX + 122;
  const cVarianceX = marginX + 155;

  doc.text('TIME GOAL / PURSUIT', cNameX, currentY + 3.8);
  doc.text('PLANNED', cPlannedX, currentY + 3.8);
  doc.text('INVESTED', cInvestedX, currentY + 3.8);
  doc.text('PROGRESS', cProgressX, currentY + 3.8);
  doc.text('STATUS / VARIANCE', cVarianceX, currentY + 3.8);

  currentY += tableH;

  if (report.pursuits.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(marginX, currentY, printableWidth, 9, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXT_SECONDARY);
    doc.text(
      'No active pursuits or time goals configured for this period.',
      marginX + 4,
      currentY + 6
    );
    currentY += 9;
  } else {
    // Show pursuits (max 5 rows to fit single page, or multiple)
    const rowHeight = 7.5;
    report.pursuits.forEach((p, idx) => {
      const isAlt = idx % 2 === 1;
      doc.setFillColor(isAlt ? 250 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.15);
      doc.rect(marginX, currentY, printableWidth, rowHeight, 'FD');

      // Clean ASCII bullet for emoji replacement
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_NAVY);
      doc.text('•', cNameX, currentY + 5);

      // Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_TEXT_PRIMARY);
      const safeName = p.name.length > 32 ? p.name.slice(0, 30) + '...' : p.name;
      doc.text(safeName, cNameX + 3.5, currentY + 4.8);

      // Planned
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_TEXT_SECONDARY);
      doc.text(`${p.targetHours.toFixed(1)} hrs`, cPlannedX, currentY + 4.8);

      // Invested
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR_TEXT_PRIMARY);
      doc.text(`${p.investedHours.toFixed(1)} hrs`, cInvestedX, currentY + 4.8);

      // Progress bar in cell
      const barX = cProgressX;
      const barY = currentY + 3;
      const barW = 18;
      const barH = 2.2;
      doc.setFillColor(...COLOR_BORDER);
      doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');

      const fillW = Math.min(barW, (p.percentage / 100) * barW);
      if (fillW > 0) {
        doc.setFillColor(
          p.isGoalMet ? COLOR_EMERALD[0] : COLOR_NAVY[0],
          p.isGoalMet ? COLOR_EMERALD[1] : COLOR_NAVY[1],
          p.isGoalMet ? COLOR_EMERALD[2] : COLOR_NAVY[2]
        );
        doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_TEXT_SECONDARY);
      doc.text(`${p.percentage}%`, barX + barW + 2, currentY + 4.8);

      // Variance / Status
      if (p.isGoalMet) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_EMERALD);
        doc.text('Goal Achieved', cVarianceX, currentY + 4.8);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR_TEXT_SECONDARY);
        const diff = Math.abs(p.varianceHours).toFixed(1);
        doc.text(`-${diff} hrs remaining`, cVarianceX, currentY + 4.8);
      }

      currentY += rowHeight;
    });
  }

  currentY += 5;

  // ================= 5. TIME DISTRIBUTION & CONSISTENCY =================
  const colW2 = (printableWidth - 6) / 2; // ~88mm each

  // Left Column: Time Distribution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('TIME DISTRIBUTION BY PURSUIT', marginX, currentY);

  // Right Column: Consistency Metrics
  doc.text('CONSISTENCY & HABIT METRICS', marginX + colW2 + 6, currentY);

  currentY += 3.5;

  const bottomSectionHeight = 28;

  // Left card: Stacked distribution bar & details
  doc.setFillColor(...COLOR_CARD_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, currentY, colW2, bottomSectionHeight, 2, 2, 'FD');

  if (report.totalInvestedMinutes === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXT_SECONDARY);
    doc.text(
      'No logged time recorded yet for this month.',
      marginX + 4,
      currentY + 14
    );
  } else {
    // Multi-segment stacked bar
    const barX = marginX + 4;
    const barY = currentY + 4.5;
    const barW = colW2 - 8;
    const barH = 4;

    const segmentColors: [number, number, number][] = [
      [43, 92, 143], // navy
      [16, 185, 129], // emerald
      [217, 119, 6], // amber
      [147, 51, 234], // purple
      [236, 72, 153], // pink
    ];

    let currentBarX = barX;
    report.pursuits.forEach((p, idx) => {
      const segW = (p.sharePercentage / 100) * barW;
      if (segW > 0) {
        const col = segmentColors[idx % segmentColors.length];
        doc.setFillColor(col[0], col[1], col[2]);
        doc.rect(currentBarX, barY, segW, barH, 'F');
        currentBarX += segW;
      }
    });

    // Breakdown list below bar
    let itemY = currentY + 12;
    report.pursuits.slice(0, 3).forEach((p, idx) => {
      const col = segmentColors[idx % segmentColors.length];
      doc.setFillColor(col[0], col[1], col[2]);
      doc.circle(barX + 2, itemY - 1, 1.2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_TEXT_PRIMARY);
      const safePName = p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name;
      doc.text(safePName, barX + 5.5, itemY);

      doc.setFont('helvetica', 'bold');
      doc.text(
        `${p.investedHours.toFixed(1)}h (${p.sharePercentage}%)`,
        barX + barW,
        itemY,
        { align: 'right' }
      );

      itemY += 4.5;
    });
  }

  // Right card: Consistency metrics list
  const rCardX = marginX + colW2 + 6;
  doc.setFillColor(...COLOR_CARD_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(rCardX, currentY, colW2, bottomSectionHeight, 2, 2, 'FD');

  const consistencyItems = [
    {
      title: 'Active Day Rate:',
      val: `${report.activeDays} of ${report.elapsedDays || report.totalDaysInMonth} days (${report.consistencyPercentage}%)`,
    },
    {
      title: 'Avg. on Active Days:',
      val:
        report.activeDays > 0
          ? `${(report.totalInvestedHours / report.activeDays).toFixed(1)} hrs / day`
          : '0.0 hrs',
    },
    {
      title: 'Longest Continuous Streak:',
      val: `${report.longestStreak} consecutive days`,
    },
    {
      title: 'Current Active Streak:',
      val: `${report.currentStreak} day${report.currentStreak === 1 ? '' : 's'}`,
    },
  ];

  let cItemY = currentY + 5.5;
  consistencyItems.forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_TEXT_SECONDARY);
    doc.text(c.title, rCardX + 4, cItemY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT_PRIMARY);
    doc.text(c.val, rCardX + colW2 - 4, cItemY, { align: 'right' });

    cItemY += 5;
  });

  currentY += bottomSectionHeight + 5;

  // ================= 6. INSIGHTS & REFLECTIONS =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('MONTHLY INSIGHTS & REFLECTIONS', marginX, currentY);

  currentY += 3.5;

  const insightsHeight = 23;
  doc.setFillColor(...COLOR_CARD_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(
    marginX,
    currentY,
    printableWidth,
    insightsHeight,
    2,
    2,
    'FD'
  );

  let insY = currentY + 4.8;
  report.insights.slice(0, 4).forEach((ins) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_NAVY);
    doc.text('•', marginX + 4, insY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLOR_TEXT_PRIMARY);

    // Auto-wrap insight text to fit width
    const lines = doc.splitTextToSize(ins, printableWidth - 12);
    doc.text(lines, marginX + 7.5, insY);
    insY += lines.length * 3.8 + 0.8;
  });

  // ================= 7. FOOTER =================
  const footerY = pageHeight - 10;
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_TEXT_SECONDARY);
  doc.text(
    'Nudge Web  •  Personal, offline, privacy-first time & habit accounting',
    marginX,
    footerY
  );
  doc.text('Page 1 of 1', pageWidth - marginX, footerY, { align: 'right' });

  return doc;
}
