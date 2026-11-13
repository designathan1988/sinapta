// A day in Notion's Relative date format (n74-relative-code): Today,
// Tomorrow or Yesterday; in the week before or after today's, "Last" or
// "Next" and the weekday; in today's week, the weekday; else the date.
// Weeks start on Monday, as Luxon's, which Notion counts with.
import { COPY } from "../../../../ui/copy.ts";

const TEXT = COPY.database.relativeDays;
const DAY_MS = 86_400_000;

const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "UTC",
});

function at(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

// The Monday that starts a day's week, in milliseconds.
function weekStart(time: number): number {
  const weekday = new Date(time).getUTCDay();
  return time - ((weekday + 6) % 7) * DAY_MS;
}

export function relativeDayWords(
  day: string,
  today: string,
  fallback: (day: string) => string,
): string {
  const time = at(day);
  const now = at(today);
  const by = Math.round((time - now) / DAY_MS);
  if (by === 0) return TEXT.today;
  if (by === 1) return TEXT.tomorrow;
  if (by === -1) return TEXT.yesterday;
  const weekday = WEEKDAY.format(time);
  const weeks = (weekStart(time) - weekStart(now)) / (7 * DAY_MS);
  if (weeks === 1) return TEXT.next(weekday);
  if (weeks === -1) return TEXT.last(weekday);
  return weeks === 0 ? weekday : fallback(day);
}
