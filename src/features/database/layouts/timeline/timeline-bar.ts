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

export interface BarDates {
  readonly startId: string;
  // The property holding the end, when the dates are separate.
  readonly endId?: string | undefined;
}

export interface BarChange {
  readonly propertyId: string;
  readonly value: DateValue;
}

export interface BarMove {
  readonly days: number;
  readonly stretch: boolean;
}

// With separate dates: a move shifts both, a stretch the end only, never
// to before the start.
function separateChanges(
  values: Readonly<Record<string, unknown>>,
  ids: { readonly startId: string; readonly endId: string },
  move: BarMove,
): BarChange[] {
  const { startId, endId } = ids;
  const start = readDateValue(values[startId]);
  const end = movedDate(values[endId] ?? values[startId], move.days);
  const moved = move.stretch
    ? undefined
    : movedDate(values[startId], move.days);
  const isBeforeStart =
    move.stretch &&
    start !== undefined &&
    end !== undefined &&
    end.start < start.start;
  return [
    ...(moved === undefined ? [] : [{ propertyId: startId, value: moved }]),
    ...(end === undefined || isBeforeStart
      ? []
      : [{ propertyId: endId, value: end }]),
  ];
}

// What moving or stretching a bar writes.
export function barChanges(
  values: Readonly<Record<string, unknown>>,
  dates: BarDates,
  move: BarMove,
): BarChange[] {
  const { startId, endId } = dates;
  if (endId !== undefined)
    return separateChanges(values, { startId, endId }, move);
  const shift = move.stretch ? stretchedDate : movedDate;
  const value = shift(values[startId], move.days);
  return value === undefined ? [] : [{ propertyId: startId, value }];
}
