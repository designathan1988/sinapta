import { html } from "lit-html";
import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
  type PropertyType,
} from "../../property-definition.ts";
import { optionName, renderChip } from "../select/index.ts";

// The stored value is a list of option ids; an empty list is an empty cell.
function readOptions(stored: unknown): string[] | undefined {
  if (!Array.isArray(stored)) return undefined;
  const ids = stored.filter((id): id is string => typeof id === "string");
  return ids.length === 0 ? undefined : ids;
}

const CONTAINS: FilterOperator = {
  id: "contains",
  label: "Contains",
  needsOperand: true,
  test: (value, operand) => readOptions(value)?.includes(operand) === true,
};

const DOES_NOT_CONTAIN: FilterOperator = {
  id: "does-not-contain",
  label: "Does not contain",
  needsOperand: true,
  test: (value, operand) => readOptions(value)?.includes(operand) !== true,
};

export const multiSelectProperty: PropertyType = {
  type: "multi-select",
  label: "Multi-select",
  editor: "options",
  read: readOptions,
  parse: (text) => readOptions(text === "" ? [] : text.split(",")),
  format: (value, property) =>
    (readOptions(value) ?? []).map((id) => optionName(id, property)).join(", "),
  compare: (a, b) =>
    (readOptions(a)?.length ?? 0) - (readOptions(b)?.length ?? 0),
  filterOperators: [CONTAINS, DOES_NOT_CONTAIN, IS_EMPTY, IS_NOT_EMPTY],
  renderCell: (value, property) =>
    html`${(readOptions(value) ?? []).map((id) => renderChip(id, property))}`,
};
