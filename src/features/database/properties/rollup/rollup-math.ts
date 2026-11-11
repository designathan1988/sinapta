// What a rollup works out from the values of the related rows: counts,
// percents, sums and other numbers, dates, or the values themselves.
import { readDateValue, type DateValue } from "../date/index.ts";
import type { RollupFunction } from "./rollup.schema.ts";

// One related row's value, read by its property's type (undefined when
// empty), and the same value as the property writes it.
export interface RollupCell {
  readonly value: unknown;
  readonly text: string;
}

export type RollupResult =
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "percent"; readonly value: number }
  | { readonly kind: "date"; readonly value: DateValue }
  | { readonly kind: "list"; readonly value: readonly string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A value worked out by a rollup, read with its type.
export function readRollupResult(value: unknown): RollupResult | undefined {
  if (!isRecord(value)) return undefined;
  const { kind } = value;
  const inner = value.value;
  if ((kind === "number" || kind === "percent") && typeof inner === "number") {
    return { kind, value: inner };
  }
  const date = kind === "date" ? readDateValue(inner) : undefined;
  if (date !== undefined) return { kind: "date", value: date };
  const isList =
    kind === "list" &&
    Array.isArray(inner) &&
    inner.every((item) => typeof item === "string");
  return isList ? { kind: "list", value: inner } : undefined;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length === 0);
}

// The values, with lists such as a multi-select's taken item by item.
function items(cells: readonly RollupCell[]): unknown[] {
  return cells.flatMap((cell) => {
    if (isEmpty(cell.value)) return [];
    const { value } = cell;
    return Array.isArray(value) ? value.map((item: unknown) => item) : [value];
  });
}

function count(value: number): RollupResult {
  return { kind: "number", value };
}

function share(part: number, whole: number): RollupResult | undefined {
  return whole === 0 ? undefined : { kind: "percent", value: part / whole };
}

function median(sorted: readonly number[]): number {
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 1
    ? upper
    : ((sorted[middle - 1] ?? 0) + upper) / 2;
}

function numbers(fn: RollupFunction, cells: readonly RollupCell[]) {
  const values = items(cells).filter(
    (value): value is number => typeof value === "number",
  );
  if (values.length === 0) return fn === "sum" ? count(0) : undefined;
  const sorted = values.toSorted((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  const first = sorted[0] ?? 0;
  const last = sorted.at(-1) ?? 0;
  const results: Partial<Record<RollupFunction, number>> = {
    sum,
    average: sum / values.length,
    median: median(sorted),
    min: first,
    max: last,
    range: last - first,
  };
  const value = results[fn];
  return value === undefined ? undefined : count(value);
}

function dates(fn: RollupFunction, cells: readonly RollupCell[]) {
  const values = cells.flatMap((cell) => readDateValue(cell.value) ?? []);
  if (values.length === 0) return undefined;
  const starts = values.map((date) => date.start).sort();
  const ends = values.map((date) => date.end ?? date.start).sort();
  const start = starts[0] ?? "";
  const end = ends.at(-1) ?? "";
  if (fn === "earliest-date")
    return { kind: "date", value: { start } } as const;
  if (fn === "latest-date")
    return { kind: "date", value: { start: end } } as const;
  return {
    kind: "date",
    value: start === end ? { start } : { start, end },
  } as const;
}

function counts(fn: RollupFunction, cells: readonly RollupCell[]) {
  const empty = cells.filter((cell) => isEmpty(cell.value)).length;
  const checked = cells.filter((cell) => cell.value === true).length;
  const all = cells.length;
  const unique = new Set(items(cells).map((value) => JSON.stringify(value)))
    .size;
  const results: Partial<Record<RollupFunction, RollupResult | undefined>> = {
    "count-all": count(all),
    "count-values": count(items(cells).length),
    "count-unique": count(unique),
    "count-empty": count(empty),
    "count-not-empty": count(all - empty),
    "percent-empty": share(empty, all),
    "percent-not-empty": share(all - empty, all),
    checked: count(checked),
    unchecked: count(all - checked),
    "percent-checked": share(checked, all),
    "percent-unchecked": share(all - checked, all),
  };
  return results[fn];
}

function texts(fn: RollupFunction, cells: readonly RollupCell[]): RollupResult {
  const written = cells.flatMap((cell) =>
    isEmpty(cell.value) || cell.text === "" ? [] : [cell.text],
  );
  const value = fn === "show-unique" ? [...new Set(written)] : written;
  return { kind: "list", value };
}

const NUMBER_FUNCTIONS = new Set<RollupFunction>([
  "sum",
  "average",
  "median",
  "min",
  "max",
  "range",
]);
const DATE_FUNCTIONS = new Set<RollupFunction>([
  "earliest-date",
  "latest-date",
  "date-range",
]);

export function applyRollup(
  fn: RollupFunction,
  cells: readonly RollupCell[],
): RollupResult | undefined {
  if (fn === "show-original" || fn === "show-unique") return texts(fn, cells);
  if (NUMBER_FUNCTIONS.has(fn)) return numbers(fn, cells);
  if (DATE_FUNCTIONS.has(fn)) return dates(fn, cells);
  return counts(fn, cells);
}
