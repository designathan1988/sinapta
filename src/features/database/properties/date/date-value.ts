// A date value: a first day, an optional last day, an optional time of
// the first day and an optional reminder. Days are calendar days,
// "2026-11-10", with no zone.
import {
  REMINDER_DAYS,
  REMINDERS,
  type Reminder,
} from "../../../../ui/date-picker/index.ts";
import {
  DEFAULT_DATE_CONFIG,
  type DateConfig,
  type DateFormat,
} from "./date.schema.ts";

export interface DateValue {
  readonly start: string;
  readonly end?: string;
  readonly time?: string;
  readonly remind?: Reminder;
}

function isReminder(value: unknown): value is Reminder {
  return REMINDERS.some((reminder) => reminder === value);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// A real day in the calendar: "2026-02-30" is not one.
export function isDay(text: unknown): text is string {
  if (typeof text !== "string" || !ISO_DATE.test(text)) return false;
  const time = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().startsWith(text);
}

export function isTime(text: unknown): text is string {
  return typeof text === "string" && TIME.test(text);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A last day that is a day and does not come before the first.
function isEndOf(end: unknown, start: string): end is string | undefined {
  return end === undefined || (isDay(end) && end >= start);
}

export function readDateValue(stored: unknown): DateValue | undefined {
  if (!isRecord(stored) || !isDay(stored.start)) return undefined;
  const { start, end, time, remind } = stored;
  if (!isEndOf(end, start)) return undefined;
  if (time !== undefined && !isTime(time)) return undefined;
  return {
    start,
    ...(end !== undefined && { end }),
    ...(time !== undefined && { time }),
    ...(isReminder(remind) && { remind }),
  };
}

// The day a date's reminder falls due, or undefined for none.
export function reminderDay(value: DateValue): string | undefined {
  if (value.remind === undefined) return undefined;
  const day = new Date(`${value.start}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - REMINDER_DAYS[value.remind]);
  return day.toISOString().slice(0, 10);
}

const LONG_DAY = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});
const MEDIUM_DAY = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatDay(day: string, format: DateFormat): string {
  const [year = "", month = "", date = ""] = day.split("-");
  switch (format) {
    case "medium":
      return MEDIUM_DAY.format(new Date(`${day}T00:00:00Z`));
    case "full":
      return LONG_DAY.format(new Date(`${day}T00:00:00Z`));
    case "month-day-year":
      return `${month}/${date}/${year}`;
    case "day-month-year":
      return `${date}/${month}/${year}`;
    case "year-month-day":
      return `${year}/${month}/${date}`;
    default: {
      const unknown: never = format;
      return unknown;
    }
  }
}

function formatTime(time: string, config: DateConfig): string {
  if (config.timeFormat === "24-hour") return time;
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour)}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDateValue(
  value: DateValue,
  config: DateConfig = DEFAULT_DATE_CONFIG,
): string {
  const { dateFormat } = config;
  const start = formatDay(value.start, dateFormat);
  const time =
    value.time === undefined ? "" : ` ${formatTime(value.time, config)}`;
  const end =
    value.end === undefined ? "" : ` → ${formatDay(value.end, dateFormat)}`;
  return `${start}${time}${end}`;
}

export interface DateParts {
  readonly start: string;
  readonly end: string;
  readonly time: string;
}

export type PartsResult =
  | { readonly ok: true; readonly value: DateValue | undefined }
  | { readonly ok: false };

// The date that a first day, a last day and a time field hold together;
// an empty first day clears the date.
export function dateFromParts(parts: DateParts): PartsResult {
  const start = parts.start.trim();
  const end = parts.end.trim();
  const time = parts.time.trim();
  if (start === "") return { ok: true, value: undefined };
  const value = readDateValue({
    start,
    ...(end !== "" && { end }),
    ...(time !== "" && { time }),
  });
  return value === undefined ? { ok: false } : { ok: true, value };
}

// The day a number of days, months or years after another; negative
// counts go back.
export function shiftDay(
  day: string,
  count: number,
  unit: "day" | "month" | "year",
): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (unit === "day") date.setUTCDate(date.getUTCDate() + count);
  if (unit === "month") date.setUTCMonth(date.getUTCMonth() + count);
  if (unit === "year") date.setUTCFullYear(date.getUTCFullYear() + count);
  return date.toISOString().slice(0, 10);
}

// True when the value shares at least one day with the period.
export function overlaps(value: DateValue, from: string, to: string): boolean {
  return value.start <= to && (value.end ?? value.start) >= from;
}
