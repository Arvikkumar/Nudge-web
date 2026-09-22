import { TaskPriority } from '../types';
import { formatDateToIso, getOffsetIso, getTodayIso } from './recurrence';

export interface ParsedNudge {
  cleanTitle: string;
  extractedDate: string;
  extractedTime: string;
  extractedCategory: string;
  extractedPriority: TaskPriority;
  extractedRepeat: string;
  confidence: number;
  hasExplicitDateTime: boolean;
  originalText: string;
  startDateIso: string;
}

const wordToDigitMap: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20',
  'twenty-five': '25',
  'twenty five': '25',
  thirty: '30',
  'thirty-five': '35',
  'thirty five': '35',
  forty: '40',
  'forty-five': '45',
  'forty five': '45',
  fifty: '50',
  'fifty-five': '55',
  'fifty five': '55',
};

const hourWordToNumber: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const minuteWordToNumber: Record<string, number> = {
  "o'clock": 0,
  oclock: 0,
  'o clock': 0,
  fifteen: 15,
  twenty: 20,
  'twenty-five': 25,
  'twenty five': 25,
  thirty: 30,
  'thirty-five': 35,
  'thirty five': 35,
  forty: 40,
  'forty-five': 45,
  'forty five': 45,
  fifty: 50,
  'fifty-five': 55,
  'fifty five': 55,
};

export const formatClockTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minutesStr} ${ampm}`;
};

export const normalizeSpokenText = (input: string): string => {
  let text = input;

  // 1. Normalize "p.m.", "a.m.", "p. m.", "a. m.", "P.M.", "A.M."
  text = text.replace(/\b([ap])\s*\.\s*m\.?/gi, '$1m');
  text = text.replace(/\b([ap])\.m\b/gi, '$1m');

  // 2. Normalize "o'clock" and "o clock"
  text = text.replace(/\bo'?\s*clock\b/gi, "o'clock");

  // 3. Common spoken duration idioms
  text = text.replace(/\bhalf\s+an\s+hour\b/gi, '30 minutes');
  text = text.replace(/\ban\s+hour\b/gi, '1 hour');
  text = text.replace(/\ba\s+hour\b/gi, '1 hour');
  text = text.replace(/\ba\s+minute\b/gi, '1 minute');
  text = text.replace(/\bcouple\s+(?:of\s+)?hours?\b/gi, '2 hours');
  text = text.replace(/\bcouple\s+(?:of\s+)?minutes?\b/gi, '2 minutes');

  // 4. "half past [hour]", "quarter past [hour]", "quarter to [hour]"
  text = text.replace(/\bhalf\s+past\s+(\w+|\d+)\b/gi, (_, hourStr) => {
    const hourNum =
      hourWordToNumber[hourStr.toLowerCase()] ?? parseInt(hourStr, 10);
    if (!isNaN(hourNum) && hourNum >= 1 && hourNum <= 12) {
      return `${hourNum}:30`;
    }
    return _;
  });

  text = text.replace(/\bquarter\s+past\s+(\w+|\d+)\b/gi, (_, hourStr) => {
    const hourNum =
      hourWordToNumber[hourStr.toLowerCase()] ?? parseInt(hourStr, 10);
    if (!isNaN(hourNum) && hourNum >= 1 && hourNum <= 12) {
      return `${hourNum}:15`;
    }
    return _;
  });

  text = text.replace(/\bquarter\s+to\s+(\w+|\d+)\b/gi, (_, hourStr) => {
    const hourNum =
      hourWordToNumber[hourStr.toLowerCase()] ?? parseInt(hourStr, 10);
    if (!isNaN(hourNum) && hourNum >= 1 && hourNum <= 12) {
      const prevHour = hourNum === 1 ? 12 : hourNum - 1;
      return `${prevHour}:45`;
    }
    return _;
  });

  // 5. Spoken hour + minute compound phrases (e.g. "seven thirty" -> "7:30")
  for (const [hWord, hNum] of Object.entries(hourWordToNumber)) {
    for (const [mWord, mNum] of Object.entries(minuteWordToNumber)) {
      if (mNum > 0) {
        const regex = new RegExp(`\\b${hWord}\\s+${mWord}\\b`, 'gi');
        const pad = mNum < 10 ? `0${mNum}` : `${mNum}`;
        text = text.replace(regex, `${hNum}:${pad}`);
      }
    }
  }

  // 6. Digit hour + minute word (e.g. "7 thirty" -> "7:30")
  for (const [mWord, mNum] of Object.entries(minuteWordToNumber)) {
    if (mNum > 0) {
      const regex = new RegExp(`\\b(\\d{1,2})\\s+${mWord}\\b`, 'gi');
      const pad = mNum < 10 ? `0${mNum}` : `${mNum}`;
      text = text.replace(regex, `$1:${pad}`);
    }
  }

  // 7. Word numbers before time units
  for (const [word, digit] of Object.entries(wordToDigitMap)) {
    const prepRegex = new RegExp(
      `\\b(in|after|at|every|for|by)\\s+${word}(?=\\s+(hours?|hrs?|minutes?|mins?|days?|weeks?|months?|o'clock|am|pm|\\b))`,
      'gi'
    );
    text = text.replace(prepRegex, `$1 ${digit}`);
    text = text.replace(
      new RegExp(
        `\\b${word}(?=\\s+(hours?|hrs?|minutes?|mins?|o'clock|am|pm)\\b)`,
        'gi'
      ),
      digit
    );
  }

  // 8. Word hours after "at": "at five" -> "at 5"
  for (const [word, digit] of Object.entries(hourWordToNumber)) {
    const atRegex = new RegExp(
      `\\b(at)\\s+${word}(?=\\s+(in the|at|o'clock|am|pm|tonight|tomorrow|today|\\b))`,
      'gi'
    );
    text = text.replace(atRegex, `$1 ${digit}`);
  }

  // 9. Inline clock period words
  text = text.replace(
    /\b(\d{1,2}(?::\d{2})?)\s+in the evening\b/gi,
    '$1 pm'
  );
  text = text.replace(
    /\b(\d{1,2}(?::\d{2})?)\s+in the afternoon\b/gi,
    '$1 pm'
  );
  text = text.replace(
    /\b(\d{1,2}(?::\d{2})?)\s+in the morning\b/gi,
    '$1 am'
  );
  text = text.replace(
    /\b(\d{1,2}(?::\d{2})?)\s+(?:at\s+night|in the night)\b/gi,
    '$1 pm'
  );
  text = text.replace(/\b(\d{1,2}(?::\d{2})?)\s+tonight\b/gi, '$1 pm tonight');

  return text;
};

export const inferCategory = (text: string): string => {
  const lower = text.toLowerCase();

  // Shopping
  if (
    /\b(buy|groceries|grocery|milk|bread|toothpaste|market|supermarket|store|shopping|order|purchase|amazon|pharmacy|cart|eggs|coffee|fruit|veggies|shampoo|soap|bill|electricity bill|pay bill)\b/i.test(
      lower
    )
  ) {
    if (/\b(electricity|water|wifi|internet|rent|gas|utilities)\b/i.test(lower)) {
      return 'Home';
    }
    return 'Shopping';
  }

  // Work
  if (
    /\b(work|meeting|meet with|client|boss|colleague|email|send email|report|presentation|documents|project|zoom|deadline|review|contract|interview|office|spreadsheet|deck|invoice|jira|slack|submit report|presentation)\b/i.test(
      lower
    )
  ) {
    return 'Work';
  }

  // Home
  if (
    /\b(home|clean|laundry|dishes|oven|water plants|plants|fix|repair|cook|dinner|kitchen|garage|trash|house|garden|vacuum|plumber|mow|ac|fridge|microwave|bedroom|electricity bill)\b/i.test(
      lower
    )
  ) {
    return 'Home';
  }

  // Personal
  if (
    /\b(call|phone|mom|mummy|dad|father|mother|friend|gym|workout|doctor|dentist|medicine|pill|meditation|read|walk|relax|birthday|party|anniversary|book|run|yoga|vet|pet|dog|cat|sleep|wake)\b/i.test(
      lower
    )
  ) {
    return 'Personal';
  }

  return 'Personal';
};

export const parseNudgeNlp = (input: string): ParsedNudge => {
  const original = input.trim();
  const todayIso = getTodayIso();

  if (!original) {
    return {
      cleanTitle: '',
      extractedDate: 'Today',
      extractedTime: 'Any time',
      extractedCategory: 'Personal',
      extractedPriority: 'Normal',
      extractedRepeat: 'Does not repeat',
      confidence: 0,
      hasExplicitDateTime: false,
      originalText: original,
      startDateIso: todayIso,
    };
  }

  let text = normalizeSpokenText(original);

  let detectedDate: string | null = null;
  let detectedTime: string | null = null;
  let detectedRepeat = 'Does not repeat';
  let detectedPriority: TaskPriority = 'Normal';
  let hasExplicitDateTime = false;
  let startDateIso = todayIso;

  // 1. Priority Keywords
  // Match prefix like "Important: ", "Urgent - ", etc.
  const prefixPriorityRegex = /^(?:important|urgent|critical|priority)\s*[:\-–—]?\s*/i;
  if (prefixPriorityRegex.test(text)) {
    detectedPriority = 'Important';
    text = text.replace(prefixPriorityRegex, ' ');
  }

  const urgentRegex =
    /\b(urgently|urgent|important|asap|high priority|critical|must do|priority)\b/gi;
  if (urgentRegex.test(text)) {
    detectedPriority = 'Important';
    text = text.replace(urgentRegex, ' ');
  }

  // 2. Recurrence Keywords
  const dailyRegex = /\b(every day|daily|everyday|each day)\b/gi;
  const weeklyRegex =
    /\b(every week|weekly|each week|every (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi;
  const monthlyRegex = /\b(every month|monthly|each month)\b/gi;
  const intervalRegex = /\bevery\s+(\d+)\s*(days?|weeks?|months?)\b/gi;

  if (dailyRegex.test(text)) {
    detectedRepeat = 'Every day';
    text = text.replace(dailyRegex, ' ');
    hasExplicitDateTime = true;
  } else if (weeklyRegex.test(text)) {
    detectedRepeat = 'Every week';
    text = text.replace(weeklyRegex, ' ');
    hasExplicitDateTime = true;
  } else if (monthlyRegex.test(text)) {
    detectedRepeat = 'Every month';
    text = text.replace(monthlyRegex, ' ');
    hasExplicitDateTime = true;
  } else {
    const intMatch = intervalRegex.exec(text);
    if (intMatch) {
      detectedRepeat = intMatch[0];
      text = text.replace(intervalRegex, ' ');
      hasExplicitDateTime = true;
    }
  }

  // 3. Relative Minutes / Hours ("in 30 minutes", "in 1 hour", "after 45 mins")
  const relativeTimeRegex =
    /\b(in|after)\s+(\d+)\s*(minutes|minute|mins|min|m|hours|hour|hrs|hr|h)\b/gi;
  const relMatch = relativeTimeRegex.exec(text);
  if (relMatch) {
    const amount = parseInt(relMatch[2], 10) || 30;
    const unit = relMatch[3].toLowerCase();
    const d = new Date();
    const startDay = d.getDate();

    if (unit.startsWith('h')) {
      d.setHours(d.getHours() + amount);
    } else {
      d.setMinutes(d.getMinutes() + amount);
    }

    detectedTime = formatClockTime(d);
    if (d.getDate() !== startDay) {
      detectedDate = 'Tomorrow';
      startDateIso = getOffsetIso(1);
    } else {
      detectedDate = 'Today';
      startDateIso = todayIso;
    }
    hasExplicitDateTime = true;
    text = text.replace(relMatch[0], ' ');
  }

  // 4. "tonight", "today night", "this night"
  const tonightRegex = /\b(today\s+night|tonight|this\s+night)\b/gi;
  if (tonightRegex.test(text)) {
    detectedDate = 'Tonight';
    startDateIso = todayIso;
    if (!detectedTime) {
      detectedTime = '8:00 PM';
    }
    hasExplicitDateTime = true;
    text = text.replace(tonightRegex, ' ');
  }

  // 5. "tomorrow", "tmrw"
  const tomorrowRegex = /\b(tomorrow|tmrw)\b/gi;
  if (tomorrowRegex.test(text)) {
    detectedDate = 'Tomorrow';
    startDateIso = getOffsetIso(1);
    hasExplicitDateTime = true;
    text = text.replace(tomorrowRegex, ' ');
  }

  // 6. "this weekend" / "next weekend" / "weekend"
  const weekendRegex = /\b((this|next)\s+weekend|weekend)\b/gi;
  if (weekendRegex.test(text)) {
    detectedDate = 'This Weekend';
    hasExplicitDateTime = true;
    text = text.replace(weekendRegex, ' ');
  }

  // 7. "this week" / "next week"
  const nextWeekRegex = /\b(next week)\b/gi;
  if (nextWeekRegex.test(text)) {
    detectedDate = 'Next Week';
    startDateIso = getOffsetIso(7);
    hasExplicitDateTime = true;
    text = text.replace(nextWeekRegex, ' ');
  }

  const thisWeekRegex = /\b(this week)\b/gi;
  if (thisWeekRegex.test(text)) {
    detectedDate = 'This Week';
    hasExplicitDateTime = true;
    text = text.replace(thisWeekRegex, ' ');
  }

  // 8. Days of week: Monday..Sunday
  const daysRegex =
    /\b(?:on\s+)?(?:(this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
  const dayMatch = daysRegex.exec(text);
  if (dayMatch && !detectedDate) {
    const rawDay = dayMatch[2].toLowerCase();
    const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
    detectedDate = dayName;

    // Calculate next occurrence date for this day of week
    const targetDayIndex = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ].indexOf(rawDay);
    const now = new Date();
    const currentDayIndex = now.getDay();
    let daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // next occurrence
    startDateIso = getOffsetIso(daysToAdd);

    hasExplicitDateTime = true;
    text = text.replace(dayMatch[0], ' ');
  }

  // 9. Clock Time Extraction (e.g. "7pm", "5:30 pm", "at 5 pm", "10:00 am")
  if (!detectedTime) {
    const clockWithAmPmRegex =
      /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:o'?clock)?\s*(am|pm)\b/gi;
    const amPmMatch = clockWithAmPmRegex.exec(text);
    if (amPmMatch) {
      let hour = parseInt(amPmMatch[1], 10);
      const minute = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
      const ampm = amPmMatch[3].toUpperCase();

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      detectedTime = formatClockTime(d);
      hasExplicitDateTime = true;
      text = text.replace(amPmMatch[0], ' ');
    }
  }

  // 10. Strip Action & Prefix Phrases
  const prefixRegex =
    /\b(please\s+)?(remind me to|remind me|remember to|don't forget to|dont forget to|nudge me to|nudge me|schedule to|schedule|set a reminder to|set a reminder for|set reminder to|set reminder for|i have to|i need to|i must|i've got to|i gotta|need to|have to|gotta)\b/gi;
  text = text.replace(prefixRegex, ' ');

  // 11. Clean punctuation & particles
  text = text.trim();
  let changed = true;
  while (changed) {
    const prev = text;
    text = text
      .replace(/^[\s.,!?;:\-–—]+/, '')
      .replace(/^(?:to|about|for|that|of|on|at|by|in|with)\s+/i, '')
      .replace(/[\s.,!?;:\-–—]+$/, '')
      .replace(/\s+(at|on|for|by|in|to|with|about)$/i, '')
      .trim();
    changed = text !== prev;
  }
  text = text.replace(/\s+/g, ' ').trim();

  const finalTitle =
    text.length > 0
      ? text.charAt(0).toUpperCase() + text.slice(1)
      : original;

  // 12. Category inference
  const finalCategory = inferCategory(finalTitle);

  const finalDate = detectedDate || 'Today';
  const finalTime = detectedTime || (finalDate === 'Tonight' ? '8:00 PM' : 'Any time');

  return {
    cleanTitle: finalTitle,
    extractedDate: finalDate,
    extractedTime: finalTime,
    extractedCategory: finalCategory,
    extractedPriority: detectedPriority,
    extractedRepeat: detectedRepeat,
    confidence: hasExplicitDateTime ? 0.95 : 0.7,
    hasExplicitDateTime,
    originalText: original,
    startDateIso,
  };
};

/**
 * Calculates updated timeLabel and dateLabel for Snooze actions.
 * Matching Android calculateSnoozeLabels:
 * - "In 30 minutes"
 * - "Tonight"
 * - "Tomorrow"
 */
export const calculateSnooze = (
  snoozeType: '30m' | 'tonight' | 'tomorrow'
): { timeLabel: string; dateLabel: string; startDateIso: string } => {
  const now = new Date();
  if (snoozeType === '30m') {
    now.setMinutes(now.getMinutes() + 30);
    return {
      timeLabel: formatClockTime(now),
      dateLabel: 'Today',
      startDateIso: getTodayIso(),
    };
  }
  if (snoozeType === 'tonight') {
    return {
      timeLabel: '8:00 PM',
      dateLabel: 'Tonight',
      startDateIso: getTodayIso(),
    };
  }
  // tomorrow
  return {
    timeLabel: '9:00 AM',
    dateLabel: 'Tomorrow',
    startDateIso: getOffsetIso(1),
  };
};
