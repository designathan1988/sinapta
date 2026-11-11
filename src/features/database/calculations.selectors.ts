// What a column's footer works out from rows: the calculations a rollup
// also offers, over the column's values, written as a rollup writes them.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { CalculationKind } from "../../model/index.ts";
import { cellValue } from "./filter-match.ts";
import { applyRollup, writeRollupResult } from "./properties/rollup/index.ts";
import { propertyType } from "./property-registry.ts";
import { TITLE_PROPERTY_ID, type TableRow } from "./table-model.selectors.ts";

const COUNTS: readonly CalculationKind[] = [
  "count-all",
  "count-values",
  "count-unique",
  "count-empty",
  "count-not-empty",
  "percent-empty",
  "percent-not-empty",
];
const NUMBERS: readonly CalculationKind[] = [
  "sum",
  "average",
  "median",
  "min",
  "max",
  "range",
];
const DATES: readonly CalculationKind[] = [
  "earliest-date",
  "latest-date",
  "date-range",
];
const CHECKS: readonly CalculationKind[] = [
  "checked",
  "unchecked",
  "percent-checked",
  "percent-unchecked",
];
const DATE_TYPES = new Set(["date", "created-time", "edited-time"]);

// Every column counts; numbers, dates and checkboxes work out more. A box
// is never empty, only unchecked, so a checkbox has its own counts.
export function calculationsFor(
  property: PropertyDefinition,
): readonly CalculationKind[] {
  if (property.type === "checkbox") return ["count-all", ...CHECKS];
  if (propertyType(property.type).editor === "number") {
    return [...COUNTS, ...NUMBERS];
  }
  if (DATE_TYPES.has(property.type)) return [...COUNTS, ...DATES];
  return COUNTS;
}

// Results by property and kind, for each list of rows a view shows.
const cache = new WeakMap<readonly TableRow[], Map<string, string>>();

export function calculate(
  rows: readonly TableRow[],
  property: PropertyDefinition,
  kind: CalculationKind,
): string {
  const known = cache.get(rows) ?? new Map<string, string>();
  cache.set(rows, known);
  const key = `${property.id}|${kind}`;
  const cached = known.get(key);
  if (cached !== undefined) return cached;
  const type = propertyType(property.type);
  const cells = rows.map((row) => {
    const value = cellValue(row, property, TITLE_PROPERTY_ID);
    const text = value === undefined ? "" : type.format(value, property);
    return { value, text };
  });
  const result = writeRollupResult(applyRollup(kind, cells));
  known.set(key, result);
  return result;
}
