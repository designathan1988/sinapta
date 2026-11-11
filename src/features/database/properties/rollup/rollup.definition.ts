// A rollup shows something worked out from the rows a relation holds: a
// count, a sum, the earliest date, or the related values themselves.
import {
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";
import { formatDateValue } from "../date/index.ts";
import { renderRollupConfig } from "./rollup-config.view.ts";
import { readRollupResult } from "./rollup-math.ts";
import { rollupConfigSchema } from "./rollup.schema.ts";
import { selectRollup } from "./rollup.selectors.ts";

const NUMBER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  useGrouping: false,
});
const PERCENT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function written(value: unknown): string {
  const result = readRollupResult(value);
  switch (result?.kind) {
    case undefined:
      return "";
    case "number":
      return NUMBER.format(result.value);
    case "percent":
      return PERCENT.format(result.value);
    case "date":
      return formatDateValue(result.value);
    case "list":
      return result.value.join(", ");
    default: {
      const unknown: never = result;
      return unknown;
    }
  }
}

function compareResults(a: unknown, b: unknown): number {
  const first = readRollupResult(a);
  const second = readRollupResult(b);
  if (typeof first?.value === "number" && typeof second?.value === "number") {
    return first.value - second.value;
  }
  return written(a).localeCompare(written(b), "en-US", { numeric: true });
}

export const rollupProperty: PropertyType = {
  type: "rollup",
  label: "Rollup",
  icon: "rollup",
  editor: "none",
  read: readRollupResult,
  parse: () => undefined,
  format: written,
  compare: compareResults,
  filterOperators: [
    {
      ...containsText(),
      test: (value, operand) => containsText().test(written(value), operand),
    },
    IS_EMPTY,
    IS_NOT_EMPTY,
  ],
  renderCell: written,
  configSchema: rollupConfigSchema,
  renderConfigEditor: renderRollupConfig,
  compute: (row, property, state) => selectRollup(state, row.id, property),
};
