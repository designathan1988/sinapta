// Values that property types give rows by themselves, such as a unique
// ID's numbers, worked out as operations for the commands that add a
// property or a row. See RowNumbering in property-definition.ts.
import {
  rowIdsOf,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import type { Operation } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { propertyType } from "./property-registry.ts";

interface Numbered {
  readonly property: PropertyDefinition;
  readonly operations: readonly Operation[];
}

// A new property's values for the rows the database has, in their order.
export function numberExistingRows(
  state: AppState,
  database: DatabaseBlock,
  property: PropertyDefinition,
): Numbered {
  const numbering = propertyType(property.type).numbering;
  if (numbering === undefined) return { property, operations: [] };
  // Its rows only: no template, and nothing that is not a page.
  const rowIds = rowIdsOf(database).filter(
    (rowId) => selectPage(state, rowId) !== undefined,
  );
  const started = numbering.start(property, rowIds.length);
  const operations = rowIds.flatMap((rowId, index): Operation[] => {
    const row = selectPage(state, rowId);
    if (row === undefined) return [];
    const value = started.values[index];
    const values = { ...row.props.values, [property.id]: value };
    const props = { ...row.props, values };
    return [
      { type: "record.update", kind: "block", id: row.id, patch: { props } },
    ];
  });
  return { property: started.property, operations };
}

interface NewRowValues {
  readonly values: Readonly<Record<string, unknown>>;
  // The database with its properties moved on, when any gave a value.
  readonly operations: readonly Operation[];
}

// The values a new row gets from its database's numbering properties.
// The values a new row starts with by its properties' types, such as a
// status's first To-do option; a row's own values replace them.
export function startingValues(
  database: DatabaseBlock,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const property of database.props.properties) {
    const value = propertyType(property.type).newRowValue?.(property);
    if (value !== undefined) values[property.id] = value;
  }
  return values;
}

export function numberNewRow(database: DatabaseBlock): NewRowValues {
  const values: Record<string, unknown> = {};
  const properties = database.props.properties.map((property) => {
    const numbering = propertyType(property.type).numbering;
    if (numbering === undefined) return property;
    const next = numbering.next(property);
    values[property.id] = next.value;
    return next.property;
  });
  if (Object.keys(values).length === 0) return { values, operations: [] };
  const props = { ...database.props, properties };
  const update: Operation = {
    type: "record.update",
    kind: "block",
    id: database.id,
    patch: { props },
  };
  return { values, operations: [update] };
}
