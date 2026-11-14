// Date functions of formulas. Dates are calendar days, or days with a
// time, worked out in UTC so that no time zone moves them.
import {
  asDate,
  asNumber,
  asText,
  FormulaError,
  type FormulaDate,
  type FormulaValue,
} from "./formula-value.ts";

const UNIT_MS: Readonly<Record<string, number>> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
};
const UNIT_MONTHS: Readonly<Record<string, number>> = {
  months: 1,
  quarters: 3,
  years: 12,
};
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function timeOf(date: FormulaDate): number {
  const iso = date.start.includes("T")
    ? `${date.start}:00Z`
    : `${date.start}T00:00:00Z`;
  return Date.parse(iso);
}

// The date at a moment, with its time when the first date had one.
function dateAt(time: number, hasTime: boolean): FormulaDate {
  const iso = new Date(time).toISOString();
  return { kind: "date", start: hasTime ? iso.slice(0, 16) : iso.slice(0, 10) };
}

function unitOf(value: FormulaValue): string {
  const unit = asText(value).toLowerCase();
  const plural = unit.endsWith("s") ? unit : `${unit}s`;
  if (UNIT_MS[plural] === undefined && UNIT_MONTHS[plural] === undefined) {
    throw new FormulaError(`"${unit}" is not a unit of time.`);
  }
  return plural;
}

function shift(args: readonly FormulaValue[], sign: number): FormulaValue {
  const [dateValue = null, countValue = null, unitValue = null] = args;
  const date = asDate(dateValue, "dateAdd");
  const count = asNumber(countValue, "dateAdd") * sign;
  const unit = unitOf(unitValue);
  const hasTime = date.start.includes("T");
  const months = UNIT_MONTHS[unit];
  if (months === undefined) {
    return dateAt(timeOf(date) + count * (UNIT_MS[unit] ?? 0), hasTime);
  }
  const moved = new Date(timeOf(date));
  moved.setUTCMonth(moved.getUTCMonth() + count * months);
  return dateAt(moved.getTime(), hasTime);
}

function between(args: readonly FormulaValue[]): FormulaValue {
  const [aValue = null, bValue = null, unitValue = null] = args;
  const a = new Date(timeOf(asDate(aValue, "dateBetween")));
  const b = new Date(timeOf(asDate(bValue, "dateBetween")));
  const unit = unitOf(unitValue);
  const months = UNIT_MONTHS[unit];
  if (months === undefined) {
    return Math.trunc((a.getTime() - b.getTime()) / (UNIT_MS[unit] ?? 1));
  }
  const total =
    (a.getUTCFullYear() - b.getUTCFullYear()) * 12 +
    a.getUTCMonth() -
    b.getUTCMonth();
  return Math.trunc(total / months);
}

const PATTERN = /YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|mm/g;

function formatDate(args: readonly FormulaValue[]): FormulaValue {
  const [dateValue = null, patternValue = "MMMM D, YYYY"] = args;
  const date = new Date(timeOf(asDate(dateValue, "formatDate")));
  const pad = (value: number) => String(value).padStart(2, "0");
  const month = date.getUTCMonth();
  const parts: Readonly<Record<string, string>> = {
    YYYY: String(date.getUTCFullYear()),
    YY: String(date.getUTCFullYear()).slice(2),
    MMMM: MONTH_NAMES[month] ?? "",
    MMM: (MONTH_NAMES[month] ?? "").slice(0, 3),
    MM: pad(month + 1),
    M: String(month + 1),
    DD: pad(date.getUTCDate()),
    D: String(date.getUTCDate()),
    HH: pad(date.getUTCHours()),
    mm: pad(date.getUTCMinutes()),
  };
  return asText(patternValue).replace(
    PATTERN,
    (token) => parts[token] ?? token,
  );
}

function part(read: (date: Date) => number) {
  return (args: readonly FormulaValue[]): FormulaValue =>
    read(new Date(timeOf(asDate(args[0] ?? null, "date"))));
}

// The ISO week of the year: weeks start on Monday, and week 1 holds the
// year's first Thursday.
function isoWeek(date: Date): number {
  const thursday = new Date(date.getTime());
  thursday.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / UNIT_MS_DAY + 1) / 7);
}

const UNIT_MS_DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;

function parseDate(args: readonly FormulaValue[]): FormulaValue {
  const found = ISO_DATE.exec(asText(args[0] ?? null).trim());
  if (found === null || Number.isNaN(Date.parse(found[0]))) {
    throw new FormulaError("parseDate needs a date written as YYYY-MM-DD.");
  }
  return { kind: "date", start: found[0] };
}

function range(args: readonly FormulaValue[]): FormulaValue {
  const start = asDate(args[0] ?? null, "dateRange").start;
  const end = asDate(args[1] ?? null, "dateRange").start;
  return { kind: "date", start, end };
}

function ends(atEnd: boolean) {
  return (args: readonly FormulaValue[]): FormulaValue => {
    const date = asDate(args[0] ?? null, atEnd ? "dateEnd" : "dateStart");
    return {
      kind: "date",
      start: atEnd ? (date.end ?? date.start) : date.start,
    };
  };
}

export interface FormulaFunction {
  // How many arguments it takes, the most possibly unlimited.
  readonly arity: readonly [number, number];
  readonly call: (args: readonly FormulaValue[], now: string) => FormulaValue;
}

export const DATE_FUNCTIONS: Readonly<Record<string, FormulaFunction>> = {
  now: { arity: [0, 0], call: (_, now) => ({ kind: "date", start: now }) },
  today: {
    arity: [0, 0],
    call: (_, now) => ({ kind: "date", start: now.slice(0, 10) }),
  },
  dateAdd: { arity: [3, 3], call: (args) => shift(args, 1) },
  dateSubtract: { arity: [3, 3], call: (args) => shift(args, -1) },
  dateBetween: { arity: [3, 3], call: between },
  formatDate: { arity: [1, 2], call: formatDate },
  year: { arity: [1, 1], call: part((date) => date.getUTCFullYear()) },
  month: { arity: [1, 1], call: part((date) => date.getUTCMonth() + 1) },
  // Notion 2.0: date() is the day of the month, day() the day of the
  // week from 1, Monday, to 7, Sunday.
  date: { arity: [1, 1], call: part((date) => date.getUTCDate()) },
  day: {
    arity: [1, 1],
    call: part((date) => ((date.getUTCDay() + 6) % 7) + 1),
  },
  hour: { arity: [1, 1], call: part((date) => date.getUTCHours()) },
  minute: { arity: [1, 1], call: part((date) => date.getUTCMinutes()) },
  week: { arity: [1, 1], call: part(isoWeek) },
  dateStart: { arity: [1, 1], call: ends(false) },
  dateEnd: { arity: [1, 1], call: ends(true) },
  dateRange: { arity: [2, 2], call: range },
  parseDate: { arity: [1, 1], call: parseDate },
  timestamp: { arity: [1, 1], call: part((date) => date.getTime()) },
  fromTimestamp: {
    arity: [1, 1],
    call: ([ms = null]) => dateAt(asNumber(ms, "fromTimestamp"), true),
  },
};
