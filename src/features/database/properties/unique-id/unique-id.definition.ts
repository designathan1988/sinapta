// A unique ID numbers each row of a database: 1, 2, 3 and so on, after an
// optional prefix such as "TASK-". The app gives the numbers; nobody
// edits them, and a deleted row's number is not given again.
import { COPY } from "../../../../ui/copy.ts";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
  type PropertyType,
} from "../../property-definition.ts";
import { renderUniqueIdConfig } from "./unique-id-config.view.ts";
import {
  readUniqueIdConfig,
  uniqueIdConfigSchema,
} from "./unique-id.schema.ts";

function readId(stored: unknown): number | undefined {
  return typeof stored === "number" && Number.isInteger(stored) && stored > 0
    ? stored
    : undefined;
}

function display(value: unknown, property: PropertyDefinition): string {
  const id = readId(value);
  if (id === undefined) return "";
  const { prefix } = readUniqueIdConfig(property.config);
  return prefix === "" ? String(id) : `${prefix}-${String(id)}`;
}

// Compares the number, so "TASK-7" and "7" both find row 7; Notion
// writes the conditions as signs, as a number's.
function comparison(
  id: string,
  label: string,
  test: (a: number, b: number) => boolean,
): FilterOperator {
  return {
    id,
    label,
    needsOperand: true,
    test: (value, operand) => {
      const number = readId(value);
      const digits = /\d+$/.exec(operand.trim())?.[0];
      return (
        number !== undefined &&
        digits !== undefined &&
        test(number, Number(digits))
      );
    },
  };
}

const ID_FILTERS = [
  comparison("equals", COPY.operators.equals, (a, b) => a === b),
  comparison("not-equals", COPY.operators.notEquals, (a, b) => a !== b),
  comparison("greater-than", COPY.operators.greaterThan, (a, b) => a > b),
  comparison("less-than", COPY.operators.lessThan, (a, b) => a < b),
  comparison("at-least", COPY.operators.atLeast, (a, b) => a >= b),
  comparison("at-most", COPY.operators.atMost, (a, b) => a <= b),
  IS_EMPTY,
  IS_NOT_EMPTY,
];

function withNext(property: PropertyDefinition, next: number) {
  const { prefix } = readUniqueIdConfig(property.config);
  return { ...property, config: { prefix, next } };
}

export const uniqueIdProperty: PropertyType = {
  type: "unique-id",
  label: COPY.propertyTypes.uniqueId,
  icon: "id",
  editor: "none",
  read: readId,
  parse: () => undefined,
  format: display,
  compare: (a, b) => (readId(a) ?? 0) - (readId(b) ?? 0),
  filterOperators: ID_FILTERS,
  renderCell: display,
  configSchema: uniqueIdConfigSchema,
  defaultConfig: () => ({ prefix: "", next: 1 }),
  renderConfigEditor: renderUniqueIdConfig,
  numbering: {
    start: (property, rowCount) => ({
      property: withNext(property, rowCount + 1),
      values: Array.from({ length: rowCount }, (_, index) => index + 1),
    }),
    next(property) {
      const { next } = readUniqueIdConfig(property.config);
      return { property: withNext(property, next + 1), value: next };
    },
  },
};
