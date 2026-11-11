// New columns beside a column, as Notion's column menu makes them:
// "Duplicate property" copies one with its values, "Insert left" and
// "Insert right" add an empty text property and open its menu to name it.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import type {
  BlockId,
  Operation,
  PropertyId,
  ViewId,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { updateProperties } from "./database.commands.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { numberExistingRows } from "./row-numbering.ts";

export interface ColumnTarget {
  readonly databaseId: BlockId;
  // The view whose column order places the new column.
  readonly viewId: ViewId;
  readonly propertyId: PropertyId;
}

interface Placed {
  readonly database: DatabaseBlock;
  readonly property: PropertyDefinition;
  // Where the original sits, and on which side the new one goes.
  readonly besideId: PropertyId;
  readonly offset: 0 | 1;
}

// The new property in the database's order, and in the view's own order
// when the view keeps one that holds the original.
function placeProperty(
  state: AppState,
  viewId: ViewId,
  placed: Placed,
): Operation[] {
  const { database, property, besideId, offset } = placed;
  const list = database.props.properties;
  const at = list.findIndex((item) => item.id === besideId) + offset;
  const properties = list.toSpliced(at, 0, property);
  const order = state.workspace.views[viewId]?.propertyOrder ?? [];
  const index = order.indexOf(besideId);
  const view: Operation[] =
    index === -1
      ? []
      : [
          {
            type: "record.update",
            kind: "view",
            id: viewId,
            patch: {
              propertyOrder: order.toSpliced(index + offset, 0, property.id),
            },
          },
        ];
  return [...updateProperties(database, properties), ...view];
}

// The rows with the original's values under the copy's id.
function copyValues(
  state: AppState,
  database: DatabaseBlock,
  ids: { from: PropertyId; to: PropertyId },
): Operation[] {
  return database.childIds.flatMap((rowId): Operation[] => {
    const row = selectPage(state, rowId);
    const value = row?.props.values?.[ids.from];
    if (row === undefined || value === undefined) return [];
    const values = { ...row.props.values, [ids.to]: value };
    const patch = { props: { ...row.props, values } };
    return [{ type: "record.update", kind: "block", id: rowId, patch }];
  });
}

export const duplicateProperty = defineCommand<ColumnTarget>({
  type: "property.duplicate",
  newIds: { properties: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const original = database?.props.properties.find(
      (item) => item.id === command.propertyId,
    );
    const [id] = command.meta.propertyIds;
    if (database === undefined || original === undefined || id === undefined) {
      return {};
    }
    const name = COPY.database.copyName(original.name);
    // A unique ID numbers the rows anew; other values are copied.
    const numbered = numberExistingRows(state, database, {
      ...original,
      id,
      name,
    });
    const values =
      numbered.operations.length > 0
        ? numbered.operations
        : copyValues(state, database, { from: original.id, to: id });
    const placed = {
      database,
      property: numbered.property,
      offset: 1,
    } as const;
    return {
      operations: [
        ...placeProperty(state, command.viewId, {
          ...placed,
          besideId: original.id,
        }),
        ...values,
      ],
    };
  },
});

export const insertProperty = defineCommand<
  ColumnTarget & { readonly side: "left" | "right" }
>({
  type: "property.insert",
  newIds: { properties: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const [id] = command.meta.propertyIds;
    if (database === undefined || id === undefined) return {};
    const property = { id, name: COPY.database.newPropertyName, type: "text" };
    const offset = command.side === "left" ? 0 : 1;
    const placed = {
      database,
      property,
      besideId: command.propertyId,
      offset,
    } as const;
    const overlay = { kind: COLUMN_MENU_OVERLAY, anchorId: id };
    return {
      operations: placeProperty(state, command.viewId, placed),
      ui: { ...state.ui, overlay },
    };
  },
});

export const propertyCopyCommands = [duplicateProperty, insertProperty];
