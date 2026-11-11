// A unique ID numbers each row of a database: 1, 2, 3 and so on, after an
// optional prefix such as "TASK-". The app gives the numbers; nobody
// edits them, and a deleted row's number is not given again.
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

// Compares the number, so "TASK-7" and "7" both find row 7.
const EQUALS: FilterOperator = {
  id: "equals",
  label: "Equals",
  needsOperand: true,
  test: (value, operand) =>
    readId(value) !== undefined &&
    readId(value) === Number(/\d+$/.exec(operand.trim())?.[0]),
};

function withNext(property: PropertyDefinition, next: number) {
  const { prefix } = readUniqueIdConfig(property.config);
  return { ...property, config: { prefix, next } };
}

export const uniqueIdProperty: PropertyType = {
  type: "unique-id",
  label: "ID",
  icon: "id",
  editor: "none",
  read: readId,
  parse: () => undefined,
  format: display,
  compare: (a, b) => (readId(a) ?? 0) - (readId(b) ?? 0),
  filterOperators: [EQUALS, IS_EMPTY, IS_NOT_EMPTY],
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
