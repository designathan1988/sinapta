// The days of a calendar month and the rows that fall on each. Days are
// calendar dates, "2026-11-10", worked out in UTC so no time zone moves them.
import { readDateValue, type DateValue } from "../../properties/date/index.ts";
import type { TableModel, TableRow } from "../../table-model.selectors.ts";

const DAY_MS = 86_400_000;
const WEEK = 7;

function toTime(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

function toDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(day: string, count: number): string {
  return toDay(toTime(day) + count * DAY_MS);
}

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function shiftMonth(month: string, count: number): string {
  const [year = 0, index = 1] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, index - 1 + count, 1));
  return toDay(shifted.getTime()).slice(0, 7);
}

// The weeks that hold the month, Sunday first, with the days of the
// months around it that fill the first and last week.
export function selectMonthWeeks(month: string): string[][] {
  const first = toTime(`${month}-01`);
  const start = first - new Date(first).getUTCDay() * DAY_MS;
  const next = toTime(`${shiftMonth(month, 1)}-01`);
  const weeks: string[][] = [];
  for (let week = start; week < next; week += WEEK * DAY_MS) {
    weeks.push(
      Array.from({ length: WEEK }, (_, index) => toDay(week + index * DAY_MS)),
    );
  }
  return weeks;
}

export interface CalendarEntries {
  readonly propertyId: string;
  readonly byDay: ReadonlyMap<string, readonly TableRow[]>;
}

// The date moved by as many days as lie between two days, its range and
// time kept; an empty date starts on the day it lands.
export function shiftDateValue(
  value: unknown,
  from: string,
  to: string,
): DateValue {
  const date = readDateValue(value);
  if (date === undefined) return { start: to };
  const days = Math.round((toTime(to) - toTime(from)) / DAY_MS);
  return {
    ...date,
    start: addDays(date.start, days),
    ...(date.end !== undefined && { end: addDays(date.end, days) }),
  };
}

// A longer range shows on its first days only, so one row cannot fill
// years of the calendar.
const MAX_RANGE_DAYS = 366;

// The days a date value covers, from its first to its last.
function daysOf(value: unknown): string[] {
  const date = readDateValue(value);
  if (date === undefined) return [];
  const days = [date.start];
  const last = date.end ?? date.start;
  while (days.length < MAX_RANGE_DAYS && (days.at(-1) ?? last) < last) {
    days.push(addDays(days.at(-1) ?? last, 1));
  }
  return days;
}

export function selectCalendarEntries(
  model: TableModel,
): CalendarEntries | undefined {
  // The view's date property, or the first one when the view has none.
  const dates = model.database.props.properties.filter(
    (item) => item.type === "date",
  );
  const property =
    dates.find((item) => item.id === model.view.datePropertyId) ?? dates[0];
  if (property === undefined) return undefined;
  const byDay = new Map<string, TableRow[]>();
  for (const row of model.rows) {
    for (const day of daysOf(row.values[property.id])) {
      byDay.set(day, [...(byDay.get(day) ?? []), row]);
    }
  }
  return { propertyId: property.id, byDay };
}
