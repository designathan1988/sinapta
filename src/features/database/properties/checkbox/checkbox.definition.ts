import type {
  FilterOperator,
  PropertyType,
} from "../../property-definition.ts";

// An unchecked box and an empty cell are the same thing.
function readChecked(stored: unknown): boolean {
  return stored === true;
}

const IS_CHECKED: FilterOperator = {
  id: "is-checked",
  label: "Is checked",
  needsOperand: false,
  test: readChecked,
};

const IS_NOT_CHECKED: FilterOperator = {
  id: "is-not-checked",
  label: "Is not checked",
  needsOperand: false,
  test: (value) => !readChecked(value),
};

export const checkboxProperty: PropertyType = {
  type: "checkbox",
  label: "Checkbox",
  editor: "toggle",
  read: readChecked,
  parse: (text) => (text === "true" ? true : undefined),
  format: (value) => (readChecked(value) ? "true" : ""),
  compare: (a, b) => Number(readChecked(a)) - Number(readChecked(b)),
  filterOperators: [IS_CHECKED, IS_NOT_CHECKED],
  renderCell: (value) => (readChecked(value) ? "☑" : "☐"),
};
