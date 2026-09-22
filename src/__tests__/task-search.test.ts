import { describe, it, expect } from 'vitest';
import {
  matchesTaskSearch,
  matchesTaskFilter,
  filterNudgeTask,
  matchesNoteSearch,
  TaskFilterOption,
} from '../utils/taskSearch';
import { NudgeTask } from '../types';
import { getTodayIso, getOffsetIso } from '../utils/recurrence';

describe('Global Task Search & Filter Tests', () => {
  const todayIso = getTodayIso();
  const tomorrowIso = getOffsetIso(1);

  const sampleTasks: NudgeTask[] = [
    {
      id: 1,
      title: 'Dentist appointment with Dr. Higgins',
      timeLabel: 'Morning (9:00 AM)',
      dateLabel: 'Tomorrow',
      startDate: tomorrowIso,
      category: 'Personal',
      priority: 'Important',
      repeat: 'Does not repeat',
      completedDates: [],
      isDone: false,
      createdAt: Date.now() - 10000,
      completedAt: null,
      isDeleted: false,
      deletedAt: null,
    },
    {
      id: 2,
      title: 'Prepare quarterly progress report',
      timeLabel: '2:30 PM',
      dateLabel: 'Today',
      startDate: todayIso,
      category: 'Work',
      priority: 'Important',
      repeat: 'Does not repeat',
      completedDates: [],
      isDone: false,
      createdAt: Date.now() - 9000,
      completedAt: null,
      isDeleted: false,
      deletedAt: null,
    },
    {
      id: 3,
      title: 'Water the basil plants and balcony herbs',
      timeLabel: 'Any time',
      dateLabel: 'Today',
      startDate: todayIso,
      category: 'Home',
      priority: 'Normal',
      repeat: 'Every day',
      completedDates: [todayIso],
      isDone: true,
      createdAt: Date.now() - 8000,
      completedAt: Date.now() - 1000,
      isDeleted: false,
      deletedAt: null,
    },
    {
      id: 4,
      title: 'Pick up oat milk and matcha tea',
      timeLabel: '5:00 PM',
      dateLabel: 'Today',
      startDate: todayIso,
      category: 'Shopping',
      priority: 'Normal',
      repeat: 'Does not repeat',
      completedDates: [],
      isDone: false,
      createdAt: Date.now() - 7000,
      completedAt: null,
      isDeleted: false,
      deletedAt: null,
    },
    {
      id: 5,
      title: 'Team sync and sprint review',
      timeLabel: 'Tonight (8:00 PM)',
      dateLabel: 'This Week',
      startDate: todayIso,
      category: 'Work',
      priority: 'Normal',
      repeat: 'Weekdays',
      completedDates: [],
      isDone: false,
      createdAt: Date.now() - 6000,
      completedAt: null,
      isDeleted: false,
      deletedAt: null,
    },
  ];

  describe('1. Global Task Search', () => {
    it('searches by task title (e.g. "doctor" finds dentist appointment)', () => {
      const results = sampleTasks.filter((t) => matchesTaskSearch(t, 'doctor', todayIso));
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(1);
    });

    it('searches by category (e.g. "work" finds all Work-related tasks)', () => {
      const results = sampleTasks.filter((t) => matchesTaskSearch(t, 'work', todayIso));
      expect(results.length).toBe(2);
      expect(results.map((t) => t.id)).toEqual([2, 5]);
    });

    it('searches by priority (e.g. "important")', () => {
      const results = sampleTasks.filter((t) => matchesTaskSearch(t, 'important', todayIso));
      expect(results.length).toBe(2);
      expect(results.map((t) => t.id)).toEqual([1, 2]);
    });

    it('searches by date (e.g. "tomorrow" finds tasks scheduled for tomorrow)', () => {
      const results = sampleTasks.filter((t) => matchesTaskSearch(t, 'tomorrow', todayIso));
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(1);
    });

    it('searches by time (e.g. "morning", "2:30", "5:00", "tonight")', () => {
      expect(sampleTasks.filter((t) => matchesTaskSearch(t, 'morning', todayIso)).length).toBe(1);
      expect(sampleTasks.filter((t) => matchesTaskSearch(t, '2:30', todayIso)).length).toBe(1);
      expect(sampleTasks.filter((t) => matchesTaskSearch(t, 'tonight', todayIso)).length).toBe(1);
    });

    it('searches by recurrence information (e.g. "every day", "daily", "weekdays")', () => {
      const dailyTasks = sampleTasks.filter((t) => matchesTaskSearch(t, 'daily', todayIso));
      expect(dailyTasks.length).toBe(1);
      expect(dailyTasks[0].id).toBe(3);

      const weekdayTasks = sampleTasks.filter((t) => matchesTaskSearch(t, 'weekdays', todayIso));
      expect(weekdayTasks.length).toBe(1);
      expect(weekdayTasks[0].id).toBe(5);
    });

    it('supports multi-token queries combining fields (e.g. "work report" or "important doctor")', () => {
      const workReport = sampleTasks.filter((t) => matchesTaskSearch(t, 'work report', todayIso));
      expect(workReport.length).toBe(1);
      expect(workReport[0].id).toBe(2);

      const docImp = sampleTasks.filter((t) => matchesTaskSearch(t, 'important doctor', todayIso));
      expect(docImp.length).toBe(1);
      expect(docImp[0].id).toBe(1);
    });

    it('returns all tasks for empty or whitespace query', () => {
      expect(sampleTasks.filter((t) => matchesTaskSearch(t, '', todayIso)).length).toBe(5);
      expect(sampleTasks.filter((t) => matchesTaskSearch(t, '   ', todayIso)).length).toBe(5);
    });
  });

  describe('2. Task Filters', () => {
    it('filters by "All"', () => {
      const results = sampleTasks.filter((t) => matchesTaskFilter(t, 'All', todayIso));
      expect(results.length).toBe(5);
    });

    it('filters by "Active"', () => {
      const results = sampleTasks.filter((t) => matchesTaskFilter(t, 'Active', todayIso));
      expect(results.length).toBe(4);
      expect(results.some((t) => t.id === 3)).toBe(false); // Task 3 is completed on today
    });

    it('filters by "Completed"', () => {
      const results = sampleTasks.filter((t) => matchesTaskFilter(t, 'Completed', todayIso));
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(3);
    });

    it('filters by Category ("Personal", "Work", "Home", "Shopping")', () => {
      expect(sampleTasks.filter((t) => matchesTaskFilter(t, 'Personal', todayIso)).length).toBe(1);
      expect(sampleTasks.filter((t) => matchesTaskFilter(t, 'Work', todayIso)).length).toBe(2);
      expect(sampleTasks.filter((t) => matchesTaskFilter(t, 'Home', todayIso)).length).toBe(1);
      expect(sampleTasks.filter((t) => matchesTaskFilter(t, 'Shopping', todayIso)).length).toBe(1);
    });

    it('filters by "Important"', () => {
      const results = sampleTasks.filter((t) => matchesTaskFilter(t, 'Important', todayIso));
      expect(results.length).toBe(2);
      expect(results.map((t) => t.id)).toEqual([1, 2]);
    });

    it('combines Search + Filter seamlessly (e.g. Search = "report", Filter = "Work")', () => {
      const results = sampleTasks.filter((t) =>
        filterNudgeTask(t, 'report', 'Work', todayIso)
      );
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Prepare quarterly progress report');
      expect(results[0].category).toBe('Work');
    });

    it('returns empty when Search + Filter do not overlap', () => {
      // "report" in Shopping category does not exist
      const results = sampleTasks.filter((t) =>
        filterNudgeTask(t, 'report', 'Shopping', todayIso)
      );
      expect(results.length).toBe(0);
    });
  });

  describe('3. Notes Search', () => {
    const sampleNotes: (NudgeTask & { content?: string })[] = [
      {
        ...sampleTasks[0],
        title: 'Call Dr. Higgins clinic',
        content: 'Check about teeth cleaning appointment details and parking options.',
      },
      {
        ...sampleTasks[1],
        title: 'Project Roadmap',
        content: 'Q4 milestones: finalize architecture review and launch beta testing.',
      },
      {
        ...sampleTasks[2],
        title: 'Gardening notes',
        content: 'Repot rosemary and prune dead leaves from basil plant.',
      },
    ];

    it('searches by note title', () => {
      const results = sampleNotes.filter((n) => matchesNoteSearch(n, 'Roadmap', 'All', todayIso));
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Project Roadmap');
    });

    it('searches across note content/description', () => {
      const results = sampleNotes.filter((n) =>
        matchesNoteSearch(n, 'parking options', 'All', todayIso)
      );
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(1);
    });

    it('searches by category in notes', () => {
      const results = sampleNotes.filter((n) => matchesNoteSearch(n, '', 'Work', todayIso));
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('Work');
    });

    it('combines notes category filter with search query', () => {
      // Searching "milestones" in Work category
      const results = sampleNotes.filter((n) =>
        matchesNoteSearch(n, 'milestones', 'Work', todayIso)
      );
      expect(results.length).toBe(1);

      // Searching "milestones" in Personal category should find nothing
      const noResults = sampleNotes.filter((n) =>
        matchesNoteSearch(n, 'milestones', 'Personal', todayIso)
      );
      expect(noResults.length).toBe(0);
    });
  });
});
