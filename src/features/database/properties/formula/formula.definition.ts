// A formula works a value out for each row from its other properties.
// The cell shows the result, or the formula's mistake.
import { COPY } from "../../../../ui/copy.ts";
import { html, type TemplateResult } from "lit-html";
import { renderIcon } from "../../../../ui/icon/index.ts";
import {
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";
import { formatDateValue } from "../date/index.ts";
import { renderFormulaConfig } from "./formula-config.view.ts";
import { formulaResult, propertiesOf } from "./formula-values.ts";
import type { FormulaDate } from "./formula.ts";
import { formulaConfigSchema } from "./formula.schema.ts";

function isError(value: unknown): value is { readonly error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function isFormulaDate(value: unknown): value is FormulaDate {
  return typeof value === "object" && value !== null && "kind" in value;
}

const NUMBER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
  useGrouping: false,
});

function written(value: unknown): string {
  if (isError(value)) return value.error;
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(written).join(", ");
  if (typeof value === "number") return NUMBER.format(value);
  if (isFormulaDate(value)) return writtenDate(value);
  return typeof value === "string" || typeof value === "boolean"
    ? String(value)
    : "";
}

function writtenDate(value: FormulaDate): string {
  const [start = "", time] = value.start.split("T");
  return formatDateValue({
    start,
    ...(time !== undefined && { time }),
    ...(value.end !== undefined && { end: value.end }),
  });
}

function renderValue(value: unknown): TemplateResult | string {
  if (isError(value)) {
    return html`<span class="formula__error">${value.error}</span>`;
  }
  if (value === true) return renderIcon("checkbox");
  return value === false ? "" : written(value);
}

// A result read as empty when it holds nothing.
function read(stored: unknown): unknown {
  if (stored === null || stored === "") return undefined;
  return Array.isArray(stored) && stored.length === 0 ? undefined : stored;
}

export const formulaProperty: PropertyType = {
  type: "formula",
  label: COPY.propertyTypes.formula,
  icon: "formula",
  editor: "none",
  read,
  parse: () => undefined,
  format: written,
  compare: (a, b) =>
    typeof a === "number" && typeof b === "number"
      ? a - b
      : written(a).localeCompare(written(b), "en-US", { numeric: true }),
  filterOperators: [
    {
      ...containsText(),
      test: (value, operand) => containsText().test(written(value), operand),
    },
    IS_EMPTY,
    IS_NOT_EMPTY,
  ],
  renderCell: renderValue,
  configSchema: formulaConfigSchema,
  renderConfigEditor: renderFormulaConfig,
  compute: (row, property, context) =>
    formulaResult(property, {
      context,
      row,
      properties: propertiesOf(context, row),
      depth: 0,
    }),
};
