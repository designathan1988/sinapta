import { html } from "lit-html";
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { GroupKey, Grouping } from "../../grouping-definition.ts";
import type {
  FilterOperator,
  PropertyType,
} from "../../property-definition.ts";

// An unchecked box and an empty cell are the same thing.
function readChecked(stored: unknown): boolean {
  return stored === true;
}

// Notion's: Is or Is not, and Checked or Unchecked, chosen after; with no
// value yet the condition keeps every row.
const VALUES = [
  { id: "unchecked", label: COPY.database.unchecked },
  { id: "checked", label: COPY.database.checked },
] as const;

function matches(value: unknown, operand: string): boolean {
  return readChecked(value) === (operand !== "unchecked");
}

const IS: FilterOperator = {
  id: "is",
  label: COPY.operators.is,
  needsOperand: true,
  choices: () => VALUES,
  listsChoices: true,
  test: matches,
};

const IS_NOT: FilterOperator = {
  id: "is-not",
  label: COPY.operators.isNot,
  needsOperand: true,
  choices: () => VALUES,
  listsChoices: true,
  test: (value, operand) => !matches(value, operand),
};

// Kept for conditions saved before the value was chosen, never offered.
const IS_CHECKED: FilterOperator = {
  id: "is-checked",
  label: COPY.operators.isChecked,
  needsOperand: false,
  isRetired: true,
  test: readChecked,
};

const IS_NOT_CHECKED: FilterOperator = {
  id: "is-not-checked",
  label: COPY.operators.isNotChecked,
  needsOperand: false,
  isRetired: true,
  test: (value) => !readChecked(value),
};

const CHECKED: GroupKey = { key: "true", label: COPY.database.checked };
const UNCHECKED: GroupKey = { key: "false", label: COPY.database.unchecked };

// Every row is checked or not; moving it between the two sets the box.
const GROUPING: Grouping = {
  keysOf: (value) => [readChecked(value) ? CHECKED : UNCHECKED],
  known: () => [CHECKED, UNCHECKED],
  valueFor: (key) => (key === CHECKED.key ? true : undefined),
};

export const checkboxProperty: PropertyType = {
  type: "checkbox",
  label: COPY.propertyTypes.checkbox,
  icon: "checkbox",
  editor: "toggle",
  read: readChecked,
  parse: (text) => (text === "true" ? true : undefined),
  format: (value) => (readChecked(value) ? "true" : ""),
  compare: (a, b) => Number(readChecked(a)) - Number(readChecked(b)),
  filterOperators: [IS, IS_NOT, IS_CHECKED, IS_NOT_CHECKED],
  // The same box as everywhere, drawn as a mark: the cell toggles it.
  renderCell: (value) => {
    const isChecked = readChecked(value);
    return html`<span
      class=${CHECKBOX_CLASS}
      role="img"
      aria-label=${isChecked ? COPY.database.checked : COPY.database.unchecked}
      ?data-checked=${isChecked}
    ></span>`;
  },
  grouping: GROUPING,
};
