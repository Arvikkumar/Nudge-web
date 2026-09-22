import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '../db/nudgeDb';
import {
  calculateMonthlyReport,
  generateTimeInvestmentPdf,
} from '../utils/timeReport';

describe('PDF Time Investment Report Tests', () => {
  beforeEach(async () => {
    // Ensure DB is initialized
    await db.getAllPursuits();
    await db.getAllTimeRecords();
  });

  it('calculates monthly report for September 2026 with seeded data', async () => {
    const report = await calculateMonthlyReport(2026, 9);

    expect(report.year).toBe(2026);
    expect(report.month).toBe(9);
    expect(report.monthName).toBe('September');
    expect(report.totalDaysInMonth).toBe(30);

    // Verify aggregate totals
    expect(report.totalInvestedHours).toBe(43.5);
    expect(report.totalTargetHours).toBe(60); // 20 + 25 + 15
    expect(report.overallGoalProgress).toBe(73); // 43.5 / 60 = 72.5% -> 73%
    expect(report.activeDays).toBeGreaterThan(0);
    expect(report.longestStreak).toBeGreaterThan(0);

    // Verify pursuits breakdown
    expect(report.pursuits.length).toBe(3);
    const writing = report.pursuits.find((p) => p.name.includes('Writing'));
    expect(writing).toBeDefined();
    expect(writing?.investedHours).toBe(18.0);
    expect(writing?.targetHours).toBe(25);

    const reading = report.pursuits.find((p) => p.name.includes('Reading'));
    expect(reading).toBeDefined();
    expect(reading?.investedHours).toBe(14.5);

    const yoga = report.pursuits.find((p) => p.name.includes('Movement') || p.name.includes('Yoga'));
    expect(yoga).toBeDefined();
    expect(yoga?.investedHours).toBe(11.0);

    // Verify daily activity length matches totalDaysInMonth
    expect(report.dailyActivity.length).toBe(30);

    // Verify insights generated
    expect(report.insights.length).toBeGreaterThan(0);
  });

  it('handles month with no time records gracefully (zero data edge case)', async () => {
    // November 2025 has no records
    const report = await calculateMonthlyReport(2025, 11);

    expect(report.year).toBe(2025);
    expect(report.month).toBe(11);
    expect(report.monthName).toBe('November');
    expect(report.totalDaysInMonth).toBe(30);
    expect(report.totalInvestedHours).toBe(0);
    expect(report.totalInvestedMinutes).toBe(0);
    expect(report.activeDays).toBe(0);
    expect(report.longestStreak).toBe(0);
    expect(report.currentStreak).toBe(0);
    expect(report.mostProductiveDay).toBeNull();
    expect(report.mostInvestedPursuit).toBeNull();
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.insights[0]).toContain('No hours were recorded');

    // Generating PDF for empty month must succeed without error
    const doc = generateTimeInvestmentPdf(report);
    expect(doc).toBeDefined();
    const pdfBlob = doc.output('blob');
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('handles months with different numbers of days (e.g. February, August)', async () => {
    const febReport = await calculateMonthlyReport(2026, 2);
    expect(febReport.totalDaysInMonth).toBe(28);
    expect(febReport.dailyActivity.length).toBe(28);

    const augReport = await calculateMonthlyReport(2026, 8);
    expect(augReport.totalDaysInMonth).toBe(31);
    expect(augReport.dailyActivity.length).toBe(31);
    expect(augReport.totalInvestedHours).toBe(48.0);
  });

  it('generates a valid, complete A4 PDF with all sections', async () => {
    const report = await calculateMonthlyReport(2026, 9);
    const doc = generateTimeInvestmentPdf(report);

    expect(doc).toBeDefined();
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210); // A4 width mm
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297); // A4 height mm

    const blob = doc.output('blob');
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000); // Substantial PDF document
  });
});
