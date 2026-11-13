// Notion's "Is relative to today": the past, next or this day, week,
// month or year, worked out from today. The operand is written
// "<direction>:<unit>", as "this:week"; "this" is the calendar day,
// week, month or year holding today, "past" the span that ends today and
// "next" the span that starts today.
import { shiftDay } from "./date-value.ts";

export const RELATIVE_DIRECTIONS = ["past", "next", "this"] as const;
export const RELATIVE_UNITS = ["day", "week", "month", "year"] as const;

export type RelativeDirection = (typeof RELATIVE_DIRECTIONS)[number];
export type RelativeUnit = (typeof RELATIVE_UNITS)[number];

export interface Relative {
  readonly direction: RelativeDirection;
  readonly unit: RelativeUnit;
}

export const DEFAULT_RELATIVE = "this:week";

export function readRelative(operand: string): Relative | undefined {
  const [first, second] = operand.trim().split(":");
  const direction = RELATIVE_DIRECTIONS.find((item) => item === first);
  const unit = RELATIVE_UNITS.find((item) => item === second);
  if (direction === undefined || unit === undefined) return undefined;
  return { direction, unit };
}

export function writeRelative(relative: Relative): string {
  return `${relative.direction}:${relative.unit}`;
}

interface Span {
  readonly from: string;
  readonly to: string;
}

function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

// The calendar span holding today: its day, its week from the week's
// first day, its month or its year.
function thisSpan(
  unit: RelativeUnit,
  today: string,
  weekStartsOn: 0 | 1,
): Span {
  if (unit === "day") return { from: today, to: today };
  if (unit === "week") {
    const back = (weekday(today) - weekStartsOn + 7) % 7;
    const from = shiftDay(today, -back, "day");
    return { from, to: shiftDay(from, 6, "day") };
  }
  const from =
    unit === "month" ? `${today.slice(0, 7)}-01` : `${today.slice(0, 4)}-01-01`;
  return { from, to: shiftDay(shiftDay(from, 1, unit), -1, "day") };
}

function step(unit: RelativeUnit): [number, "day" | "month" | "year"] {
  if (unit === "week") return [7, "day"];
  return [1, unit];
}

// The days a relative period covers, both ends included.
export function relativeSpan(
  relative: Relative,
  today: string,
  weekStartsOn: 0 | 1 = 0,
): Span {
  const { direction, unit } = relative;
  if (direction === "this") return thisSpan(unit, today, weekStartsOn);
  const [count, by] = step(unit);
  return direction === "past"
    ? { from: shiftDay(today, -count, by), to: today }
    : { from: today, to: shiftDay(today, count, by) };
}
