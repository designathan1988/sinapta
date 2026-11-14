// What a column's footer works out from rows: the calculations a rollup
// also offers, over the column's values, written as a rollup writes them.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { CalculationKind } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { cellValue } from "./filter-match.ts";
import { formatNumber, readNumberConfig } from "./properties/number/index.ts";
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
  const worked = applyRollup(kind, cells);
  const result = NUMBERS.includes(kind)
    ? writeNumber(worked, property)
    : writeRollupResult(worked);
  known.set(key, result);
  return result;
}

// A sum, average or the like of a number column is written as the
// column writes its values ("$1,500.00"), to two places at most.
function writeNumber(
  result: ReturnType<typeof applyRollup>,
  property: PropertyDefinition,
): string {
  if (result?.kind !== "number" || property.type !== "number") {
    return writeRollupResult(result);
  }
  const rounded = Math.round(result.value * 100) / 100;
  return formatNumber(rounded, readNumberConfig(property.config));
}

// A count above 99 written "99+", as Notion's "Show large counts as 99+".
const COUNT_CAP = 99;

export function cappedCount(
  result: string,
  kind: CalculationKind,
  isCapped: boolean,
): string {
  if (!isCapped || !isCount(kind)) return result;
  return Number(result) > COUNT_CAP ? COPY.database.countCapped : result;
}

export const NO_CALCULATION = "none";

// The choices of a column's calculation: "None" first, then the
// calculations that fit its property, each with its name.
export function calculationChoices(
  property: PropertyDefinition,
): { readonly value: string; readonly label: string }[] {
  const labels = COPY.database.rollupFunctions;
  return [
    { value: NO_CALCULATION, label: COPY.database.noGrouping },
    ...calculationsFor(property).map((item) => ({
      value: item,
      label: labels[item],
    })),
  ];
}

export interface CalculationGroups {
  readonly count: readonly CalculationKind[];
  readonly percent: readonly CalculationKind[];
  readonly more: readonly CalculationKind[];
}

function isPercent(kind: CalculationKind): boolean {
  return kind.startsWith("percent-");
}

function isCount(kind: CalculationKind): boolean {
  return (
    kind.startsWith("count-") || kind === "checked" || kind === "unchecked"
  );
}

// The calculations of a column as Notion groups them: counts, percents,
// and the rest, such as sums and dates, under "More options".
export function calculationGroups(
  property: PropertyDefinition,
): CalculationGroups {
  const kinds = calculationsFor(property);
  return {
    count: kinds.filter(isCount),
    percent: kinds.filter(isPercent),
    more: kinds.filter((kind) => !isCount(kind) && !isPercent(kind)),
  };
}
