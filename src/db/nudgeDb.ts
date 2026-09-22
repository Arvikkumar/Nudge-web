import { NudgeTask, Pursuit, TimeGoalRecord, NudgeSettings } from '../types';
import { formatDateToIso, getTodayIso } from '../utils/recurrence';

const DB_NAME = 'nudge_web_db';
const DB_VERSION = 3; // Version 3 adds pursuits and time tracking stores
const STORE_TASKS = 'tasks';
const STORE_PURSUITS = 'pursuits';
const STORE_TIME_RECORDS = 'time_records';
const STORE_SETTINGS = 'settings';

const INITIAL_SEED_TASKS: Omit<NudgeTask, 'id'>[] = [
  {
    title: 'Water the basil and check soil moisture',
    timeLabel: '9:00 AM',
    dateLabel: 'Today',
    category: 'Home',
    priority: 'Normal',
    repeat: 'Every day',
    startDate: getTodayIso(),
    completedDates: [],
    isDone: false,
    createdAt: Date.now() - 3600000 * 3,
    completedAt: null,
    isDeleted: false,
    deletedAt: null,
  },
  {
    title: 'Send draft notes to Maya',
    timeLabel: '2:30 PM',
    dateLabel: 'Today',
    category: 'Work',
    priority: 'Normal',
    repeat: 'Does not repeat',
    startDate: getTodayIso(),
    completedDates: [],
    isDone: false,
    createdAt: Date.now() - 3600000 * 2,
    completedAt: null,
    isDeleted: false,
    deletedAt: null,
  },
  {
    title: 'Pick up herbal tea and honey',
    timeLabel: '5:00 PM',
    dateLabel: 'Today',
    category: 'Shopping',
    priority: 'Normal',
    repeat: 'Does not repeat',
    startDate: getTodayIso(),
    completedDates: [],
    isDone: true,
    createdAt: Date.now() - 3600000 * 5,
    completedAt: Date.now() - 3600000,
    isDeleted: false,
    deletedAt: null,
  },
  {
    title: 'Dentist appointment checkup',
    timeLabel: '10:00 AM',
    dateLabel: 'Tomorrow',
    category: 'Personal',
    priority: 'Important',
    repeat: 'Does not repeat',
    startDate: getTodayIso(),
    completedDates: [],
    isDone: false,
    createdAt: Date.now() - 3600000 * 6,
    completedAt: null,
    isDeleted: false,
    deletedAt: null,
  },
];

const INITIAL_SEED_PURSUITS: Omit<Pursuit, 'id'>[] = [
  {
    name: 'Reading & Philosophy',
    targetHours: 20,
    loggedMinutes: 14.5 * 60,
    color: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    emoji: '📚',
    isArchived: false,
    createdAt: Date.now() - 3600000 * 24 * 7,
  },
  {
    name: 'Deep Creative Writing',
    targetHours: 25,
    loggedMinutes: 18.0 * 60,
    color: 'bg-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    emoji: '✍️',
    isArchived: false,
    createdAt: Date.now() - 3600000 * 24 * 7,
  },
  {
    name: 'Morning Movement & Yoga',
    targetHours: 15,
    loggedMinutes: 11.0 * 60,
    color: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    emoji: '🧘',
    isArchived: false,
    createdAt: Date.now() - 3600000 * 24 * 7,
  },
];

const DEFAULT_SETTINGS: NudgeSettings = {
  themeMode: 'system',
  notificationsEnabled: true,
  nudgeAgainEnabled: true,
  defaultSnooze: '30m',
  eventReminderOption: 'off',
  eventReminderCustomDays: 3,
};

let dbPromise: Promise<IDBDatabase> | null = null;

export const getDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Tasks store
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const store = db.createObjectStore(STORE_TASKS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('isDone', 'isDone', { unique: false });
        store.createIndex('isDeleted', 'isDeleted', { unique: false });
        store.createIndex('dateLabel', 'dateLabel', { unique: false });

        INITIAL_SEED_TASKS.forEach((seedTask) => {
          store.add(seedTask);
        });
      }

      // 2. Pursuits store
      if (!db.objectStoreNames.contains(STORE_PURSUITS)) {
        const pursuitStore = db.createObjectStore(STORE_PURSUITS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        pursuitStore.createIndex('createdAt', 'createdAt', { unique: false });
        pursuitStore.createIndex('isArchived', 'isArchived', { unique: false });

        INITIAL_SEED_PURSUITS.forEach((seedPursuit) => {
          pursuitStore.add(seedPursuit);
        });
      }

      // 3. Time records store
      if (!db.objectStoreNames.contains(STORE_TIME_RECORDS)) {
        const recordStore = db.createObjectStore(STORE_TIME_RECORDS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        recordStore.createIndex('pursuitId', 'pursuitId', { unique: false });
        recordStore.createIndex('date', 'date', { unique: false });
      }

      // 4. Settings store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        const settingsStore = db.createObjectStore(STORE_SETTINGS, {
          keyPath: 'key',
        });
        settingsStore.add({ key: 'preferences', ...DEFAULT_SETTINGS });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
};

// =================== TASKS ===================

export const getAllTasks = async (): Promise<NudgeTask[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readonly');
    const store = transaction.objectStore(STORE_TASKS);
    const request = store.getAll();

    request.onsuccess = () => {
      const rawResults: any[] = request.result || [];
      const results: NudgeTask[] = rawResults
        .filter((task) => !task.isDeleted)
        .map((task) => ({
          ...task,
          repeat: task.repeat || 'Does not repeat',
          startDate:
            task.startDate ||
            (task.createdAt
              ? formatDateToIso(new Date(task.createdAt))
              : getTodayIso()),
          completedDates: Array.isArray(task.completedDates)
            ? task.completedDates
            : [],
        }));

      results.sort((a, b) => {
        if (a.isDone === b.isDone) {
          return b.createdAt - a.createdAt;
        }
        return a.isDone ? 1 : -1;
      });

      resolve(results);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const addTask = async (
  taskData: Omit<
    NudgeTask,
    'id' | 'createdAt' | 'completedAt' | 'isDeleted' | 'deletedAt'
  >
): Promise<NudgeTask> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readwrite');
    const store = transaction.objectStore(STORE_TASKS);

    const newTask: Omit<NudgeTask, 'id'> = {
      ...taskData,
      repeat: taskData.repeat || 'Does not repeat',
      startDate: taskData.startDate || getTodayIso(),
      completedDates: Array.isArray(taskData.completedDates)
        ? taskData.completedDates
        : [],
      createdAt: Date.now(),
      completedAt: taskData.isDone ? Date.now() : null,
      isDeleted: false,
      deletedAt: null,
    };

    const request = store.add(newTask);

    request.onsuccess = () => {
      const generatedId = request.result as number;
      resolve({
        id: generatedId,
        ...newTask,
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const updateTask = async (task: NudgeTask): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readwrite');
    const store = transaction.objectStore(STORE_TASKS);
    const request = store.put(task);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const deleteTask = async (id: number): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readwrite');
    const store = transaction.objectStore(STORE_TASKS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const task = getRequest.result as NudgeTask | undefined;
      if (task) {
        task.isDeleted = true;
        task.deletedAt = Date.now();
        const putRequest = store.put(task);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
};

export const restoreTask = async (id: number): Promise<NudgeTask | undefined> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readwrite');
    const store = transaction.objectStore(STORE_TASKS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const task = getRequest.result as NudgeTask | undefined;
      if (task) {
        task.isDeleted = false;
        task.deletedAt = null;
        const putRequest = store.put(task);
        putRequest.onsuccess = () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nudge-data-changed'));
          }
          resolve(task);
        };
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(undefined);
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
};

export const getDeletedTasks = async (): Promise<NudgeTask[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readonly');
    const store = transaction.objectStore(STORE_TASKS);
    const request = store.getAll();

    request.onsuccess = () => {
      const rawResults: any[] = request.result || [];
      const results: NudgeTask[] = rawResults
        .filter((task) => Boolean(task.isDeleted))
        .map((task) => ({
          ...task,
          repeat: task.repeat || 'Does not repeat',
          startDate:
            task.startDate ||
            (task.createdAt
              ? formatDateToIso(new Date(task.createdAt))
              : getTodayIso()),
          completedDates: Array.isArray(task.completedDates)
            ? task.completedDates
            : [],
        }))
        .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

      resolve(results);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// =================== PURSUITS & HOURS ===================

export const getAllPursuits = async (): Promise<Pursuit[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PURSUITS], 'readonly');
    const store = transaction.objectStore(STORE_PURSUITS);
    const request = store.getAll();

    request.onsuccess = async () => {
      let results: Pursuit[] = request.result || [];
      if (results.length === 0) {
        // If empty, seed initial pursuits
        const seedTransaction = db.transaction([STORE_PURSUITS], 'readwrite');
        const seedStore = seedTransaction.objectStore(STORE_PURSUITS);
        for (const p of INITIAL_SEED_PURSUITS) {
          seedStore.add(p);
        }
        seedTransaction.oncomplete = async () => {
          const freshDb = await getDb();
          const tx = freshDb.transaction([STORE_PURSUITS], 'readonly');
          const req = tx.objectStore(STORE_PURSUITS).getAll();
          req.onsuccess = () => resolve(req.result || []);
        };
        return;
      }
      resolve(results.filter((p) => !p.isArchived));
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const addPursuit = async (
  data: Omit<Pursuit, 'id' | 'createdAt' | 'isArchived'>
): Promise<Pursuit> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PURSUITS], 'readwrite');
    const store = transaction.objectStore(STORE_PURSUITS);

    const newPursuit: Omit<Pursuit, 'id'> = {
      ...data,
      isArchived: false,
      createdAt: Date.now(),
    };

    const request = store.add(newPursuit);

    request.onsuccess = () => {
      const generatedId = request.result as number;
      resolve({
        id: generatedId,
        ...newPursuit,
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const updatePursuit = async (pursuit: Pursuit): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PURSUITS], 'readwrite');
    const store = transaction.objectStore(STORE_PURSUITS);
    const request = store.put(pursuit);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deletePursuit = async (id: number): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PURSUITS], 'readwrite');
    const store = transaction.objectStore(STORE_PURSUITS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const logPursuitTime = async (
  pursuitId: number,
  additionalMinutes: number,
  note?: string
): Promise<Pursuit | null> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_PURSUITS, STORE_TIME_RECORDS],
      'readwrite'
    );
    const pursuitStore = transaction.objectStore(STORE_PURSUITS);
    const recordStore = transaction.objectStore(STORE_TIME_RECORDS);

    const getReq = pursuitStore.get(pursuitId);

    getReq.onsuccess = () => {
      const pursuit = getReq.result as Pursuit | undefined;
      if (!pursuit) {
        resolve(null);
        return;
      }

      pursuit.loggedMinutes = (pursuit.loggedMinutes || 0) + additionalMinutes;
      pursuitStore.put(pursuit);

      // Also record time log entry
      const record: Omit<TimeGoalRecord, 'id'> = {
        pursuitId,
        date: getTodayIso(),
        minutes: additionalMinutes,
        note,
        createdAt: Date.now(),
      };
      recordStore.add(record);

      transaction.oncomplete = () => {
        resolve(pursuit);
      };
    };

    transaction.onerror = () => reject(transaction.error);
  });
};

// =================== TIME RECORDS & REPORTS ===================

const INITIAL_SEED_RECORDS: Omit<TimeGoalRecord, 'id'>[] = [
  // September 2026 - Reading & Philosophy (Pursuit 1, Total: 870 min / 14.5 hrs)
  { pursuitId: 1, date: '2026-09-02', minutes: 60, note: 'Stoic meditations', createdAt: 1788343200000 },
  { pursuitId: 1, date: '2026-09-04', minutes: 90, note: 'Eastern philosophy chapter 3', createdAt: 1788516000000 },
  { pursuitId: 1, date: '2026-09-06', minutes: 120, note: 'Deep reading session', createdAt: 1788688800000 },
  { pursuitId: 1, date: '2026-09-08', minutes: 60, note: 'Evening reflection', createdAt: 1788861600000 },
  { pursuitId: 1, date: '2026-09-10', minutes: 90, note: 'Epictetus notes', createdAt: 1789034400000 },
  { pursuitId: 1, date: '2026-09-12', minutes: 90, note: 'Marcus Aurelius journal', createdAt: 1789207200000 },
  { pursuitId: 1, date: '2026-09-14', minutes: 120, note: 'Philosophy treatise review', createdAt: 1789380000000 },
  { pursuitId: 1, date: '2026-09-16', minutes: 60, note: 'Poetry and ethics', createdAt: 1789552800000 },
  { pursuitId: 1, date: '2026-09-18', minutes: 90, note: 'Weekend reading', createdAt: 1789725600000 },
  { pursuitId: 1, date: '2026-09-20', minutes: 90, note: 'Essay review', createdAt: 1789898400000 },

  // September 2026 - Deep Creative Writing (Pursuit 2, Total: 1080 min / 18.0 hrs)
  { pursuitId: 2, date: '2026-09-01', minutes: 90, note: 'Novel chapter 4 draft', createdAt: 1788256800000 },
  { pursuitId: 2, date: '2026-09-03', minutes: 120, note: 'Character dialog refinement', createdAt: 1788429600000 },
  { pursuitId: 2, date: '2026-09-05', minutes: 90, note: 'Scene outline', createdAt: 1788602400000 },
  { pursuitId: 2, date: '2026-09-07', minutes: 120, note: 'Plot revision', createdAt: 1788775200000 },
  { pursuitId: 2, date: '2026-09-09', minutes: 90, note: 'Creative morning sprint', createdAt: 1788948000000 },
  { pursuitId: 2, date: '2026-09-11', minutes: 120, note: 'Chapter 5 transition', createdAt: 1789120800000 },
  { pursuitId: 2, date: '2026-09-13', minutes: 90, note: 'Editing pass', createdAt: 1789293600000 },
  { pursuitId: 2, date: '2026-09-15', minutes: 150, note: 'Extended flow session', createdAt: 1789466400000 },
  { pursuitId: 2, date: '2026-09-17', minutes: 90, note: 'Worldbuilding notes', createdAt: 1789639200000 },
  { pursuitId: 2, date: '2026-09-19', minutes: 120, note: 'Climax drafting', createdAt: 1789812000000 },

  // September 2026 - Morning Movement & Yoga (Pursuit 3, Total: 660 min / 11.0 hrs)
  { pursuitId: 3, date: '2026-09-01', minutes: 60, note: 'Sun salutations', createdAt: 1788256800000 },
  { pursuitId: 3, date: '2026-09-02', minutes: 60, note: 'Vinyasa flow', createdAt: 1788343200000 },
  { pursuitId: 3, date: '2026-09-03', minutes: 60, note: 'Core & mobility', createdAt: 1788429600000 },
  { pursuitId: 3, date: '2026-09-05', minutes: 60, note: 'Gentle stretching', createdAt: 1788602400000 },
  { pursuitId: 3, date: '2026-09-06', minutes: 60, note: 'Balance & postures', createdAt: 1788688800000 },
  { pursuitId: 3, date: '2026-09-08', minutes: 60, note: 'Breathwork & asanas', createdAt: 1788861600000 },
  { pursuitId: 3, date: '2026-09-09', minutes: 60, note: 'Morning rhythm', createdAt: 1788948000000 },
  { pursuitId: 3, date: '2026-09-12', minutes: 60, note: 'Deep flexibility flow', createdAt: 1789207200000 },
  { pursuitId: 3, date: '2026-09-15', minutes: 60, note: 'Hatha yoga', createdAt: 1789466400000 },
  { pursuitId: 3, date: '2026-09-18', minutes: 60, note: 'Hip opening sequence', createdAt: 1789725600000 },
  { pursuitId: 3, date: '2026-09-20', minutes: 60, note: 'Weekend restorative yoga', createdAt: 1789898400000 },

  // August 2026 - Past Month Records (Total: 48.0 hrs / 2880 min)
  { pursuitId: 1, date: '2026-08-05', minutes: 180, note: 'Philosophy study', createdAt: 1785933600000 },
  { pursuitId: 1, date: '2026-08-12', minutes: 240, note: 'Deep book analysis', createdAt: 1786538400000 },
  { pursuitId: 1, date: '2026-08-19', minutes: 270, note: 'Essays on mindfulness', createdAt: 1787143200000 },
  { pursuitId: 1, date: '2026-08-26', minutes: 270, note: 'Monthly reading wrap', createdAt: 1787748000000 },

  { pursuitId: 2, date: '2026-08-04', minutes: 300, note: 'Writing workshop', createdAt: 1785847200000 },
  { pursuitId: 2, date: '2026-08-11', minutes: 300, note: 'Chapter 2 and 3 draft', createdAt: 1786452000000 },
  { pursuitId: 2, date: '2026-08-18', minutes: 300, note: 'Dialogue rewriting', createdAt: 1787056800000 },
  { pursuitId: 2, date: '2026-08-25', minutes: 300, note: 'Manuscript milestone', createdAt: 1787661600000 },

  { pursuitId: 3, date: '2026-08-03', minutes: 180, note: 'Morning practice', createdAt: 1785760800000 },
  { pursuitId: 3, date: '2026-08-10', minutes: 180, note: 'Yoga immersion', createdAt: 1786365600000 },
  { pursuitId: 3, date: '2026-08-17', minutes: 180, note: 'Breath and body work', createdAt: 1786970400000 },
  { pursuitId: 3, date: '2026-08-24', minutes: 180, note: 'Restorative weekend flow', createdAt: 1787575200000 },
];

const seedInitialTimeRecords = async (): Promise<TimeGoalRecord[]> => {
  const db = await getDb();
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_TIME_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORE_TIME_RECORDS);
      const inserted: TimeGoalRecord[] = [];

      INITIAL_SEED_RECORDS.forEach((rec, idx) => {
        const id = idx + 1;
        store.add({ ...rec, id });
        inserted.push({ ...rec, id });
      });

      transaction.oncomplete = () => {
        resolve(inserted);
      };
      transaction.onerror = () => {
        resolve([]);
      };
    } catch {
      resolve([]);
    }
  });
};

export const getAllTimeRecords = async (): Promise<TimeGoalRecord[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TIME_RECORDS], 'readonly');
    const store = transaction.objectStore(STORE_TIME_RECORDS);
    const request = store.getAll();

    request.onsuccess = async () => {
      let records: TimeGoalRecord[] = request.result || [];
      if (records.length === 0) {
        records = await seedInitialTimeRecords();
      }
      resolve(records);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const getTimeRecordsForMonth = async (
  year: number,
  month: number
): Promise<TimeGoalRecord[]> => {
  const all = await getAllTimeRecords();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return all.filter((r) => r.date.startsWith(prefix));
};

export const addTimeRecord = async (
  recordData: Omit<TimeGoalRecord, 'id' | 'createdAt'>
): Promise<TimeGoalRecord> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TIME_RECORDS], 'readwrite');
    const store = transaction.objectStore(STORE_TIME_RECORDS);
    const newRecord: Omit<TimeGoalRecord, 'id'> = {
      ...recordData,
      createdAt: Date.now(),
    };
    const req = store.add(newRecord);
    req.onsuccess = () => {
      resolve({
        id: req.result as number,
        ...newRecord,
      });
    };
    req.onerror = () => reject(req.error);
  });
};

// =================== SETTINGS ===================

export const getSettings = async (): Promise<NudgeSettings> => {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_SETTINGS], 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('preferences');

      request.onsuccess = () => {
        if (request.result) {
          const { key, ...rest } = request.result;
          resolve({
            ...DEFAULT_SETTINGS,
            ...(rest as NudgeSettings),
          });
        } else {
          // Fall back to localStorage or defaults
          const hasLocalStorage = typeof localStorage !== 'undefined';
          const savedTheme = hasLocalStorage ? (localStorage.getItem('nudge_theme_mode') as any) || DEFAULT_SETTINGS.themeMode : DEFAULT_SETTINGS.themeMode;
          const savedNotif = hasLocalStorage ? localStorage.getItem('nudge_notifications_enabled') : null;
          const savedNudgeAgain = hasLocalStorage ? localStorage.getItem('nudge_again_enabled') : null;
          const savedSnooze = hasLocalStorage ? localStorage.getItem('nudge_default_snooze') || DEFAULT_SETTINGS.defaultSnooze : DEFAULT_SETTINGS.defaultSnooze;
          const savedEventReminder = hasLocalStorage ? (localStorage.getItem('nudge_event_reminder_option') as any) || DEFAULT_SETTINGS.eventReminderOption : DEFAULT_SETTINGS.eventReminderOption;
          const savedCustomDays = hasLocalStorage && localStorage.getItem('nudge_event_reminder_custom_days')
            ? parseInt(localStorage.getItem('nudge_event_reminder_custom_days') || '3', 10)
            : DEFAULT_SETTINGS.eventReminderCustomDays;

          resolve({
            themeMode: savedTheme,
            notificationsEnabled: savedNotif !== null ? savedNotif === 'true' : DEFAULT_SETTINGS.notificationsEnabled,
            nudgeAgainEnabled: savedNudgeAgain !== null ? savedNudgeAgain === 'true' : DEFAULT_SETTINGS.nudgeAgainEnabled,
            defaultSnooze: savedSnooze,
            eventReminderOption: savedEventReminder,
            eventReminderCustomDays: savedCustomDays,
          });
        }
      };

      request.onerror = () => {
        resolve(DEFAULT_SETTINGS);
      };
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: NudgeSettings): Promise<void> => {
  // Sync to localStorage immediately if available
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('nudge_theme_mode', settings.themeMode);
    localStorage.setItem('nudge_notifications_enabled', String(settings.notificationsEnabled));
    localStorage.setItem('nudge_again_enabled', String(settings.nudgeAgainEnabled));
    localStorage.setItem('nudge_default_snooze', settings.defaultSnooze);
    if (settings.eventReminderOption) {
      localStorage.setItem('nudge_event_reminder_option', settings.eventReminderOption);
    }
    if (settings.eventReminderCustomDays) {
      localStorage.setItem('nudge_event_reminder_custom_days', String(settings.eventReminderCustomDays));
    }
  }

  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.put({ key: 'preferences', ...settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error saving settings to db:', err);
  }
};

// =================== BACKUP & RESTORE DATABASE OPERATIONS ===================

export interface NudgeBackupData {
  tasks: NudgeTask[];
  pursuits: Pursuit[];
  timeRecords: TimeGoalRecord[];
  settings: NudgeSettings;
  userName?: string;
  deliveredEventReminders?: string[];
}

export const getRawTasks = async (): Promise<NudgeTask[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TASKS], 'readonly');
    const store = transaction.objectStore(STORE_TASKS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getRawPursuits = async (): Promise<Pursuit[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PURSUITS], 'readonly');
    const store = transaction.objectStore(STORE_PURSUITS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getRawTimeRecords = async (): Promise<TimeGoalRecord[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TIME_RECORDS], 'readonly');
    const store = transaction.objectStore(STORE_TIME_RECORDS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const replaceWholeDatabase = async (data: NudgeBackupData): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_TASKS, STORE_PURSUITS, STORE_TIME_RECORDS, STORE_SETTINGS],
      'readwrite'
    );

    transaction.onerror = () => {
      reject(transaction.error || new Error('Failed to replace database contents'));
    };

    transaction.onabort = () => {
      reject(new Error('Database transaction was aborted during restore'));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    const taskStore = transaction.objectStore(STORE_TASKS);
    const pursuitStore = transaction.objectStore(STORE_PURSUITS);
    const timeRecordStore = transaction.objectStore(STORE_TIME_RECORDS);
    const settingsStore = transaction.objectStore(STORE_SETTINGS);

    // Clear existing data in stores
    taskStore.clear();
    pursuitStore.clear();
    timeRecordStore.clear();

    // Populate tasks
    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks) {
        taskStore.put(t);
      }
    }

    // Populate pursuits
    if (Array.isArray(data.pursuits)) {
      for (const p of data.pursuits) {
        pursuitStore.put(p);
      }
    }

    // Populate time records
    if (Array.isArray(data.timeRecords)) {
      for (const tr of data.timeRecords) {
        timeRecordStore.put(tr);
      }
    }

    // Populate settings
    if (data.settings) {
      settingsStore.put({ key: 'preferences', ...data.settings });
    }
  });
};

export const clearAllDatabaseStores = async (): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_TASKS, STORE_PURSUITS, STORE_TIME_RECORDS, STORE_SETTINGS],
      'readwrite'
    );

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    const taskStore = transaction.objectStore(STORE_TASKS);
    const pursuitStore = transaction.objectStore(STORE_PURSUITS);
    const timeRecordStore = transaction.objectStore(STORE_TIME_RECORDS);
    const settingsStore = transaction.objectStore(STORE_SETTINGS);

    taskStore.clear();
    pursuitStore.clear();
    timeRecordStore.clear();
    settingsStore.put({ key: 'preferences', ...DEFAULT_SETTINGS });
  });
};
