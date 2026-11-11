// The days of a calendar month and the rows that fall on each. Days are
// calendar dates, "2026-11-10", worked out in UTC so no time zone moves them.
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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
    const value = row.values[property.id];
    if (typeof value !== "string" || !ISO_DATE.test(value)) continue;
    byDay.set(value, [...(byDay.get(value) ?? []), row]);
  }
  return { propertyId: property.id, byDay };
}
