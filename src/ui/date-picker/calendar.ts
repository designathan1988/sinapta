// The days a month's calendar shows, as Notion's date picker lays them
// out: six weeks from the Sunday on or before the first, the days of the
// months around it marked. Days are "YYYY-MM-DD" and months "YYYY-MM",
// counted in UTC so no time zone moves them.

export interface CalendarDay {
  readonly day: string;
  readonly isInMonth: boolean;
}

const WEEKS = 6;
const DAYS_IN_WEEK = 7;
const DAY_MS = 86_400_000;

function utc(month: string, date = 1): Date {
  const [year = 1970, number = 1] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1, date));
}

function dayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function shiftMonth(month: string, by: number): string {
  const first = utc(month);
  first.setUTCMonth(first.getUTCMonth() + by);
  return monthOf(dayOf(first));
}

export function calendarDays(month: string): CalendarDay[] {
  const first = utc(month);
  const start = first.getTime() - first.getUTCDay() * DAY_MS;
  return Array.from({ length: WEEKS * DAYS_IN_WEEK }, (_, index) => {
    const day = dayOf(new Date(start + index * DAY_MS));
    return { day, isInMonth: monthOf(day) === month };
  });
}
