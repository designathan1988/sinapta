import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import type { GroupKey, Grouping } from "../../grouping-definition.ts";
import {
  foldText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
  type PropertyType,
} from "../../property-definition.ts";

// The stored value is the id of one option.
function readOption(stored: unknown): string | undefined {
  return typeof stored === "string" && stored !== "" ? stored : undefined;
}

export function optionName(id: unknown, property: PropertyDefinition): string {
  return property.options?.find((option) => option.id === id)?.name ?? "";
}

export function renderChip(
  id: unknown,
  property: PropertyDefinition,
): TemplateResult | string {
  const option = property.options?.find((item) => item.id === id);
  if (option === undefined) return "";
  return html`<span class="database__chip" data-color=${option.color}
    >${option.name}</span
  >`;
}

// The groups of an option property: one per option, in its order.
export function optionGroups(property: PropertyDefinition): GroupKey[] {
  return (property.options ?? []).map((option) => ({
    key: option.id,
    label: option.name,
    color: option.color,
  }));
}

// A row moves into an option's group by taking the option, and into the
// group of empty values by losing it.
export const OPTION_GROUPING: Grouping = {
  keysOf: (value, property) =>
    optionGroups(property).filter((group) => group.key === value),
  known: optionGroups,
  keepsEmptyGroup: true,
  valueFor: (key) => (key === "" ? undefined : key),
};

// Filters compare with the option's id, which the filter editor supplies.
const IS: FilterOperator = {
  id: "is",
  label: "Is",
  needsOperand: true,
  test: (value, operand) => readOption(value) === operand,
};

const IS_NOT: FilterOperator = {
  id: "is-not",
  label: "Is not",
  needsOperand: true,
  test: (value, operand) => readOption(value) !== operand,
};

export const selectProperty: PropertyType = {
  type: "select",
  label: "Select",
  icon: "select",
  editor: "options",
  read: readOption,
  parse: readOption,
  format: optionName,
  compare: (a, b) => foldText(String(a)).localeCompare(foldText(String(b))),
  filterOperators: [IS, IS_NOT, IS_EMPTY, IS_NOT_EMPTY],
  renderCell: renderChip,
  grouping: OPTION_GROUPING,
};
