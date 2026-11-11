// A rollup property's config: the relation it follows, the property of
// the related rows it reads and what it works out from them.
import * as v from "valibot";

export const ROLLUP_FUNCTIONS = [
  "show-original",
  "show-unique",
  "count-all",
  "count-values",
  "count-unique",
  "count-empty",
  "count-not-empty",
  "percent-empty",
  "percent-not-empty",
  "sum",
  "average",
  "median",
  "min",
  "max",
  "range",
  "earliest-date",
  "latest-date",
  "date-range",
  "checked",
  "unchecked",
  "percent-checked",
  "percent-unchecked",
] as const;

export const rollupConfigSchema = v.object({
  relationPropertyId: v.string(),
  // A property of the related database, or "title" for the page titles.
  targetPropertyId: v.string(),
  function: v.picklist(ROLLUP_FUNCTIONS),
});

export type RollupConfig = v.InferOutput<typeof rollupConfigSchema>;
export type RollupFunction = RollupConfig["function"];

// The config held in memory, already checked on load, read with its type;
// undefined while the rollup has no relation yet.
export function readRollupConfig(config: unknown): RollupConfig | undefined {
  return v.is(rollupConfigSchema, config) ? config : undefined;
}
