import 'fake-indexeddb/auto';
import * as db from '../src/db/nudgeDb';
import {
  doesTaskOccurOnDate,
  isTaskCompletedOnDate,
  formatDateToIso,
  isRepeatingTask,
} from '../src/utils/recurrence';

async function runRecurringTasksTests() {
  console.log('=== TEST 1: Setting up base dates ===');
  const d0 = new Date(2026, 8, 22); // 2026-09-22 (Tuesday)
  const d1 = new Date(2026, 8, 23); // 2026-09-23 (Wednesday)
  const d2 = new Date(2026, 8, 24); // 2026-09-24 (Thursday)

  const date0 = formatDateToIso(d0);
  const date1 = formatDateToIso(d1);
  const date2 = formatDateToIso(d2);

  console.log(`Date 0: ${date0}, Date 1: ${date1}, Date 2: ${date2}`);

  console.log('\n=== TEST 2: Testing "Every day" Daily Recurrence across multiple dates ===');
  const dailyTask = await db.addTask({
    title: 'Morning stretch & deep breathing',
    timeLabel: '8:00 AM',
    dateLabel: 'Today',
    category: 'Personal',
    priority: 'Normal',
    repeat: 'Every day',
    startDate: date0,
    completedDates: [],
    isDone: false,
  });

  const occursDailyDate0 = doesTaskOccurOnDate(dailyTask, date0);
  const occursDailyDate1 = doesTaskOccurOnDate(dailyTask, date1);
  const occursDailyDate2 = doesTaskOccurOnDate(dailyTask, date2);

  console.log(`Every day occurs on ${date0}? ${occursDailyDate0}`);
  console.log(`Every day occurs on ${date1}? ${occursDailyDate1}`);
  console.log(`Every day occurs on ${date2}? ${occursDailyDate2}`);

  if (!occursDailyDate0 || !occursDailyDate1 || !occursDailyDate2) {
    throw new Error('FAIL: Daily task must occur on all future consecutive dates');
  }
  console.log('✓ PASS: "Every day" occurs across multiple consecutive dates.');

  console.log('\n=== TEST 3: Testing "Every 2 days" Interval Recurrence ===');
  const intervalTask = await db.addTask({
    title: 'Water the peace lily',
    timeLabel: '9:00 AM',
    dateLabel: 'Today',
    category: 'Home',
    priority: 'Normal',
    repeat: 'Every 2 days',
    startDate: date0,
    completedDates: [],
    isDone: false,
  });

  const occursIntervalDate0 = doesTaskOccurOnDate(intervalTask, date0);
  const occursIntervalDate1 = doesTaskOccurOnDate(intervalTask, date1);
  const occursIntervalDate2 = doesTaskOccurOnDate(intervalTask, date2);

  console.log(`Every 2 days occurs on Day 0 (${date0})? ${occursIntervalDate0} (expected: true)`);
  console.log(`Every 2 days occurs on Day 1 (${date1})? ${occursIntervalDate1} (expected: false)`);
  console.log(`Every 2 days occurs on Day 2 (${date2})? ${occursIntervalDate2} (expected: true)`);

  if (!occursIntervalDate0 || occursIntervalDate1 || !occursIntervalDate2) {
    throw new Error('FAIL: Interval task did not follow 2-day cadence');
  }
  console.log('✓ PASS: "Every 2 days" correctly generates occurrences on day 0 and day 2, but not day 1.');

  console.log('\n=== TEST 4: Completing Date 0 occurrence does NOT remove or complete Date 1 / Date 2 ===');
  // Mark date0 occurrence complete for daily task
  dailyTask.completedDates = [date0];
  await db.updateTask(dailyTask);

  const isDailyCompletedOnDate0 = isTaskCompletedOnDate(dailyTask, date0);
  const isDailyCompletedOnDate1 = isTaskCompletedOnDate(dailyTask, date1);

  console.log(`Date 0 occurrence completed? ${isDailyCompletedOnDate0} (expected: true)`);
  console.log(`Date 1 occurrence completed? ${isDailyCompletedOnDate1} (expected: false)`);
  console.log(`Does Date 1 occurrence still exist? ${doesTaskOccurOnDate(dailyTask, date1)} (expected: true)`);

  if (!isDailyCompletedOnDate0) {
    throw new Error('FAIL: Date 0 occurrence should be marked complete');
  }
  if (isDailyCompletedOnDate1) {
    throw new Error('FAIL: Completing Date 0 must NOT complete Date 1 occurrence');
  }
  if (!doesTaskOccurOnDate(dailyTask, date1)) {
    throw new Error('FAIL: Completing Date 0 must NOT remove Date 1 occurrence');
  }
  console.log('✓ PASS: Completing today occurrence preserves tomorrow active occurrence.');

  console.log('\n=== TEST 5: Persistence check after simulated browser reload ===');
  const allLoaded = await db.getAllTasks();
  const reloadedDaily = allLoaded.find((t) => t.id === dailyTask.id);
  const reloadedInterval = allLoaded.find((t) => t.id === intervalTask.id);

  if (!reloadedDaily) throw new Error('Daily task missing after reload');
  if (!reloadedInterval) throw new Error('Interval task missing after reload');

  if (reloadedDaily.repeat !== 'Every day') throw new Error('Daily repeat rule not persisted');
  if (reloadedInterval.repeat !== 'Every 2 days') throw new Error('Interval repeat rule not persisted');

  if (!reloadedDaily.completedDates.includes(date0)) {
    throw new Error('Completed occurrence date not persisted in IndexedDB');
  }
  if (isTaskCompletedOnDate(reloadedDaily, date1)) {
    throw new Error('Tomorrow occurrence erroneously marked complete after reload');
  }

  console.log(`Persisted completedDates: ${JSON.stringify(reloadedDaily.completedDates)}`);
  console.log(`Persisted repeat rules: Daily="${reloadedDaily.repeat}", Interval="${reloadedInterval.repeat}"`);
  console.log('✓ PASS: All recurrence configurations and occurrence completions persist in IndexedDB.');

  console.log('\n=== TEST 6: Non-recurring one-time tasks continue working unchanged ===');
  const oneTimeTask = await db.addTask({
    title: 'Drop off package at post office',
    timeLabel: '11:00 AM',
    dateLabel: 'Today',
    category: 'Shopping',
    priority: 'Normal',
    repeat: 'Does not repeat',
    startDate: date0,
    completedDates: [],
    isDone: false,
  });

  if (isRepeatingTask(oneTimeTask)) {
    throw new Error('One-time task incorrectly flagged as repeating');
  }
  oneTimeTask.isDone = true;
  await db.updateTask(oneTimeTask);

  const reloadedOneTime = (await db.getAllTasks()).find((t) => t.id === oneTimeTask.id);
  if (!reloadedOneTime?.isDone) {
    throw new Error('One-time task isDone did not persist');
  }
  console.log('✓ PASS: One-time tasks continue functioning properly with isDone.');

  console.log('\n>>> ALL 6 RECURRING TASK TESTS PASSED SUCCESSFULLY! <<<');
}

runRecurringTasksTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
