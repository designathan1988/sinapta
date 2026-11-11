// A rollup shows something worked out from the rows a relation holds: a
// count, a sum, the earliest date, or the related values themselves.
import {
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";
import { renderRollupConfig } from "./rollup-config.view.ts";
import { readRollupResult, writeRollupResult } from "./rollup-math.ts";
import { rollupConfigSchema } from "./rollup.schema.ts";
import { selectRollup } from "./rollup.selectors.ts";

function compareResults(a: unknown, b: unknown): number {
  const first = readRollupResult(a);
  const second = readRollupResult(b);
  if (typeof first?.value === "number" && typeof second?.value === "number") {
    return first.value - second.value;
  }
  return writeRollupResult(a).localeCompare(writeRollupResult(b), "en-US", {
    numeric: true,
  });
}

export const rollupProperty: PropertyType = {
  type: "rollup",
  label: "Rollup",
  icon: "rollup",
  editor: "none",
  read: readRollupResult,
  parse: () => undefined,
  format: writeRollupResult,
  compare: compareResults,
  filterOperators: [
    {
      ...containsText(),
      test: (value, operand) =>
        containsText().test(writeRollupResult(value), operand),
    },
    IS_EMPTY,
    IS_NOT_EMPTY,
  ],
  renderCell: writeRollupResult,
  configSchema: rollupConfigSchema,
  renderConfigEditor: renderRollupConfig,
  compute: (row, property, { state }) => selectRollup(state, row.id, property),
};
