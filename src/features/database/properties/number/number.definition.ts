import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
  type PropertyType,
} from "../../property-definition.ts";
import { renderNumberCell } from "./number-cell.view.ts";
import { renderNumberConfig } from "./number-config.view.ts";
import { DEFAULT_NUMBER_CONFIG, numberConfigSchema } from "./number.schema.ts";

function readNumber(stored: unknown): number | undefined {
  return typeof stored === "number" && Number.isFinite(stored)
    ? stored
    : undefined;
}

// Accepts a decimal comma as well as a decimal point.
function parseNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return undefined;
  return readNumber(Number(trimmed));
}

function comparison(
  id: string,
  label: string,
  test: (a: number, b: number) => boolean,
): FilterOperator {
  return {
    id,
    label,
    needsOperand: true,
    test(value, operand) {
      const number = readNumber(value);
      const other = parseNumber(operand);
      return number !== undefined && other !== undefined && test(number, other);
    },
  };
}

export const numberProperty: PropertyType = {
  type: "number",
  label: "Number",
  icon: "number",
  editor: "number",
  input: { mode: "decimal" },
  read: readNumber,
  parse: parseNumber,
  format: (value) => (readNumber(value) === undefined ? "" : String(value)),
  compare: (a, b) => (readNumber(a) ?? 0) - (readNumber(b) ?? 0),
  filterOperators: [
    comparison("equals", "Equals", (a, b) => a === b),
    comparison("greater-than", "Greater than", (a, b) => a > b),
    comparison("less-than", "Less than", (a, b) => a < b),
    IS_EMPTY,
    IS_NOT_EMPTY,
  ],
  renderCell(value, property) {
    const number = readNumber(value);
    return number === undefined ? "" : renderNumberCell(number, property);
  },
  configSchema: numberConfigSchema,
  defaultConfig: () => DEFAULT_NUMBER_CONFIG,
  renderConfigEditor: renderNumberConfig,
};
