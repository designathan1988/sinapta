// The days a repeating template makes its rows on, as Notion's cadence:
// every interval days, months or years from a day, or every interval
// weeks on some weekdays, the weeks counted from the start.
import type { Repeat } from "../../blocks/page/index.ts";

export interface RepeatRule {
  readonly every: Repeat["every"];
  readonly interval?: number | undefined;
  readonly weekdays?: readonly number[] | undefined;
  readonly start?: string | undefined;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function at(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function dayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(day: string, days: number): string {
  return dayOf(new Date(at(day).getTime() + days * DAY_MS));
}

// 0 for Monday to 6 for Sunday.
export function weekdayOf(day: string): number {
  return (at(day).getUTCDay() + 6) % 7;
}

function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// The same day some months on, or the month's last day when it has fewer.
function shiftMonths(day: string, months: number): string {
  const date = at(day);
  const total = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const dayOfMonth = Math.min(date.getUTCDate(), daysIn(year, month));
  return dayOf(new Date(Date.UTC(year, month, dayOfMonth)));
}

// Whether the day falls on a week the rule makes rows in, and on one of
// its weekdays.
function isWeekDay(day: string, rule: RepeatRule, anchor: string): boolean {
  const weekdays = rule.weekdays ?? [weekdayOf(anchor)];
  if (!weekdays.includes(weekdayOf(day))) return false;
  const mondays =
    (at(addDays(day, -weekdayOf(day))).getTime() -
      at(addDays(anchor, -weekdayOf(anchor))).getTime()) /
    (7 * DAY_MS);
  return Math.round(mondays) % (rule.interval ?? 1) === 0;
}

export function nextOccurrence(day: string, rule: RepeatRule): string {
  const interval = rule.interval ?? 1;
  if (rule.every === "month") return shiftMonths(day, interval);
  if (rule.every === "year") return shiftMonths(day, 12 * interval);
  if (rule.every === "day") return addDays(day, interval);
  const anchor = rule.start ?? day;
  // A week's next day is at most this many days on.
  for (let step = 1; step <= 7 * interval; step += 1) {
    const next = addDays(day, step);
    if (isWeekDay(next, rule, anchor)) return next;
  }
  return addDays(day, 7 * interval);
}

// The first day from this one the rule makes a row on.
export function firstOnOrAfter(day: string, rule: RepeatRule): string {
  if (rule.every !== "week" || rule.weekdays === undefined) return day;
  const anchor = rule.start ?? day;
  return isWeekDay(day, rule, anchor)
    ? day
    : nextOccurrence(day, { ...rule, start: anchor });
}

// The first of its days after today.
export function firstAfter(
  day: string,
  rule: RepeatRule,
  today: string,
): string {
  let next = day;
  while (next <= today) next = nextOccurrence(next, rule);
  return next;
}
