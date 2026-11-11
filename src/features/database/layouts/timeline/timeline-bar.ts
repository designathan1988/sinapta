// How a timeline's bar moves: by whole days, or by its last day only when
// it stretches, never ending before it starts.
import { readDateValue, type DateValue } from "../../properties/date/index.ts";

const DAY_MS = 86_400_000;

function addDays(day: string, count: number): string {
  const time = Date.parse(`${day}T00:00:00Z`) + count * DAY_MS;
  return new Date(time).toISOString().slice(0, 10);
}

export function movedDate(
  stored: unknown,
  days: number,
): DateValue | undefined {
  const date = readDateValue(stored);
  if (date === undefined) return undefined;
  return {
    ...date,
    start: addDays(date.start, days),
    ...(date.end !== undefined && { end: addDays(date.end, days) }),
  };
}

export function stretchedDate(
  stored: unknown,
  days: number,
): DateValue | undefined {
  const date = readDateValue(stored);
  if (date === undefined) return undefined;
  const end = addDays(date.end ?? date.start, days);
  if (end < date.start) return date;
  const { end: _end, ...single } = date;
  return end === date.start ? single : { ...date, end };
}

// The days a key moves or stretches a bar by: Alt with Left or Right.
export function keyDays(event: KeyboardEvent): number | undefined {
  if (!event.altKey) return undefined;
  if (event.key === "ArrowLeft") return -1;
  return event.key === "ArrowRight" ? 1 : undefined;
}
