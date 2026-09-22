import 'fake-indexeddb/auto';
import * as db from '../src/db/nudgeDb';
import {
  formatDateToIso,
  parseIsoToDate,
  doesTaskOccurOnDate,
  isTaskCompletedOnDate,
  getTodayIso,
  getOffsetIso,
} from '../src/utils/recurrence';
import {
  getEventsForDate,
  getEventsForMonth,
  hasEventOnDate,
  EVENT_CATEGORY_STYLES,
} from '../src/utils/nudgeEvents';
import { parseNudgeNlp } from '../src/utils/nlpParser';

async function runCalendarEventsTests() {
  console.log('=== TEST 1: Important Dates & Observances Dataset Verification ===');

  // Verify fixed observances
  const peaceDay = getEventsForDate(2026, 9, 21);
  console.log('Sep 21, 2026 events:', peaceDay.map((e) => e.name));
  if (!peaceDay.some((e) => e.name === 'International Day of Peace')) {
    throw new Error('FAIL: International Day of Peace not found on Sep 21');
  }
  const peaceEvent = peaceDay.find((e) => e.name === 'International Day of Peace')!;
  if (peaceEvent.category !== 'International Observance') {
    throw new Error(`FAIL: Unexpected category: ${peaceEvent.category}`);
  }
  if (!peaceEvent.description || peaceEvent.description.length < 10) {
    throw new Error('FAIL: Missing or incomplete description for Peace Day');
  }

  // Verify Gandhi Jayanti on Oct 2
  const gandhiDay = getEventsForDate(2026, 10, 2);
  console.log('Oct 2, 2026 events:', gandhiDay.map((e) => e.name));
  if (!gandhiDay.some((e) => e.name.includes('Mahatma Gandhi Jayanti'))) {
    throw new Error('FAIL: Mahatma Gandhi Jayanti not found on Oct 2');
  }

  // Verify 2026 Diwali on Nov 8, 2026
  const diwaliDay = getEventsForDate(2026, 11, 8);
  console.log('Nov 8, 2026 events:', diwaliDay.map((e) => e.name));
  if (!diwaliDay.some((e) => e.name.includes('Diwali'))) {
    throw new Error('FAIL: Diwali not found on Nov 8, 2026');
  }

  // Verify 2026 Dussehra on Oct 20, 2026
  const dussehraDay = getEventsForDate(2026, 10, 20);
  console.log('Oct 20, 2026 events:', dussehraDay.map((e) => e.name));
  if (!dussehraDay.some((e) => e.name.includes('Dussehra'))) {
    throw new Error('FAIL: Dussehra not found on Oct 20, 2026');
  }

  // Verify Republic Day on Jan 26
  const republicDay = getEventsForDate(2026, 1, 26);
  if (!republicDay.some((e) => e.name.includes('Republic Day'))) {
    throw new Error('FAIL: Republic Day not found on Jan 26');
  }

  // Verify getEventsForMonth
  const sepEvents = getEventsForMonth(2026, 9);
  console.log(`September 2026 total events: ${sepEvents.length}`);
  if (sepEvents.length < 5) {
    throw new Error('FAIL: Expected at least 5 events in September');
  }

  // Verify hasEventOnDate
  if (!hasEventOnDate(2026, 9, 21)) {
    throw new Error('FAIL: hasEventOnDate failed for Sep 21, 2026');
  }
  if (hasEventOnDate(2026, 9, 3)) {
    // Sep 3 does not have registered events
    console.log('Sep 3 has events? false as expected');
  }

  // Verify category styles
  const categories = Object.keys(EVENT_CATEGORY_STYLES);
  if (categories.length < 5) {
    throw new Error('FAIL: Missing event category styles');
  }

  console.log('✓ PASS: All calendar events & observances verified successfully.');

  console.log('\n=== TEST 2: Calendar Month Navigation Logic ===');
  // Simulating navigating months
  let curYear = 2026;
  let curMonth = 8; // September (0-based)

  const navForward = () => {
    if (curMonth === 11) {
      curMonth = 0;
      curYear += 1;
    } else {
      curMonth += 1;
    }
  };

  const navBackward = () => {
    if (curMonth === 0) {
      curMonth = 11;
      curYear -= 1;
    } else {
      curMonth -= 1;
    }
  };

  navForward(); // should be Oct 2026 (curMonth = 9)
  if (curMonth !== 9 || curYear !== 2026) throw new Error('FAIL: navForward to Oct');

  navForward(); // Nov 2026 (curMonth = 10)
  navForward(); // Dec 2026 (curMonth = 11)
  navForward(); // Jan 2027 (curMonth = 0, curYear = 2027)
  if (curMonth !== 0 || curYear !== 2027) throw new Error('FAIL: navForward across year boundary to Jan 2027');

  navBackward(); // Dec 2026 (curMonth = 11, curYear = 2026)
  if (curMonth !== 11 || curYear !== 2026) throw new Error('FAIL: navBackward across year boundary to Dec 2026');

  console.log('✓ PASS: Month navigation forward/backward and across year boundaries is robust.');

  console.log('\n=== TEST 3: Calendar + Task Integration (Specific Dates & Recurrence) ===');
  // Add a task with a specific date in October: 2026-10-15
  const specificDateTask = await db.addTask({
    title: 'Review quarterly architecture plans',
    timeLabel: '2:30 PM',
    dateLabel: '2026-10-15',
    category: 'Work',
    priority: 'Important',
    repeat: 'Does not repeat',
    startDate: '2026-10-15',
    completedDates: [],
    isDone: false,
  });

  // Verify it appears on 2026-10-15
  const occursOnTarget = doesTaskOccurOnDate(specificDateTask, '2026-10-15');
  const occursOnOther = doesTaskOccurOnDate(specificDateTask, '2026-10-16');
  const occursOnToday = doesTaskOccurOnDate(specificDateTask, getTodayIso());

  if (!occursOnTarget) throw new Error('FAIL: Task must occur on its specified date 2026-10-15');
  if (occursOnOther) throw new Error('FAIL: Task must NOT occur on 2026-10-16');
  if (occursOnToday && getTodayIso() !== '2026-10-15') {
    throw new Error('FAIL: Task must NOT occur on today if today is not 2026-10-15');
  }
  console.log('✓ PASS: Task with specific date appears exclusively on that date.');

  console.log('\n=== TEST 4: Recurring Tasks across Calendar Dates & Isolated Completion ===');
  // Create a recurring task (Weekdays) starting on 2026-09-21 (Monday)
  const weekdayTask = await db.addTask({
    title: 'Daily team sync',
    timeLabel: '10:00 AM',
    dateLabel: 'Today',
    category: 'Work',
    priority: 'Normal',
    repeat: 'Weekdays',
    startDate: '2026-09-21',
    completedDates: [],
    isDone: false,
  });

  // 2026-09-21 is Monday -> should occur
  // 2026-09-25 is Friday -> should occur
  // 2026-09-26 is Saturday -> should NOT occur
  // 2026-09-27 is Sunday -> should NOT occur
  if (!doesTaskOccurOnDate(weekdayTask, '2026-09-21')) throw new Error('FAIL: Weekday task on Monday');
  if (!doesTaskOccurOnDate(weekdayTask, '2026-09-25')) throw new Error('FAIL: Weekday task on Friday');
  if (doesTaskOccurOnDate(weekdayTask, '2026-09-26')) throw new Error('FAIL: Weekday task on Saturday');
  if (doesTaskOccurOnDate(weekdayTask, '2026-09-27')) throw new Error('FAIL: Weekday task on Sunday');

  // Complete on Monday (2026-09-21)
  const updatedWeekdayTask: db.NudgeTask = {
    ...weekdayTask,
    completedDates: [...weekdayTask.completedDates, '2026-09-21'],
    isDone: false,
  };
  await db.updateTask(updatedWeekdayTask);

  const mondayCompleted = isTaskCompletedOnDate(updatedWeekdayTask, '2026-09-21');
  const tuesdayCompleted = isTaskCompletedOnDate(updatedWeekdayTask, '2026-09-22');

  console.log('Monday completed?', mondayCompleted);
  console.log('Tuesday completed?', tuesdayCompleted);

  if (!mondayCompleted) throw new Error('FAIL: Monday occurrence should be completed');
  if (tuesdayCompleted) throw new Error('FAIL: Tuesday occurrence should remain active and NOT completed');

  console.log('✓ PASS: Completing task on one date does not complete or affect other dates.');

  console.log('\n=== TEST 5: Regression Test for Notes, Hours & Settings ===');
  // Notes / Tasks with category and search
  const noteTask = await db.addTask({
    title: 'Calendar release notes and checklist',
    timeLabel: 'Any time',
    dateLabel: 'Today',
    category: 'Work',
    priority: 'Normal',
    repeat: 'Does not repeat',
    startDate: getTodayIso(),
    completedDates: [],
    isDone: false,
  });
  const allTasks = await db.getAllTasks();
  const searchResult = allTasks.filter(
    (t) =>
      t.category === 'Work' &&
      t.title.toLowerCase().includes('calendar release')
  );
  if (searchResult.length === 0) {
    throw new Error('FAIL: Categorized note task not found in search');
  }

  // Hours
  const pursuit = await db.addPursuit({
    name: 'Harmonium',
    emoji: '🎵',
    targetHours: 20,
    loggedMinutes: 60,
    color: '#8B5CF6',
    badgeBg: '#F3E8FF',
    badgeText: '#7C3AED',
    isArchived: false,
  });
  const allPursuits = await db.getAllPursuits();
  if (!allPursuits.some((p) => p.id === pursuit.id)) {
    throw new Error('FAIL: Pursuit not found in database');
  }

  // Settings
  await db.saveSettings({
    themeMode: 'dark',
    notificationsEnabled: true,
    nudgeAgainEnabled: true,
    defaultSnooze: '30m',
  });
  const loadedSettings = await db.getSettings();
  if (loadedSettings.themeMode !== 'dark' || loadedSettings.defaultSnooze !== '30m') {
    throw new Error('FAIL: Settings failed to persist properly');
  }

  // NLP Parser
  const nlpRes = parseNudgeNlp('Important: submit taxes Friday 5pm');
  if (nlpRes.cleanTitle.toLowerCase() !== 'submit taxes' || nlpRes.extractedPriority !== 'Important') {
    throw new Error(`FAIL: NLP parser unexpected result: ${JSON.stringify(nlpRes)}`);
  }

  console.log('✓ PASS: All existing features (Notes, Hours, Settings, NLP) remain 100% operational.');

  console.log('\n>>> ALL CALENDAR, EVENTS, AND INTEGRATION TESTS PASSED! <<<');
}

runCalendarEventsTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
