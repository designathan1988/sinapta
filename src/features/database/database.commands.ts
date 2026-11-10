// Commands on a database: its columns and its rows.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
  type SelectOption,
} from "../../blocks/database/index.ts";
import {
  DATABASE_TYPE,
  PAGE_TYPE,
  selectPage,
} from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type PropertyId,
  type View,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";

export const DEFAULT_VIEW_NAME = "Table";

function emptyView(id: View["id"], databaseId: BlockId, name: string): View {
  return {
    id,
    databaseId,
    name,
    type: "table",
    sorts: [],
    filters: [],
    propertyOrder: [],
    propertyWidths: {},
    hiddenPropertyIds: [],
  };
}

// Creates an empty database with one table view, and opens it.
export const createDatabase = defineCommand<{ parentId: BlockId | null }>({
  type: "database.create",
  newIds: { blocks: 1, views: 1 },
  handle(state, command) {
    const id = command.meta.blockIds[0];
    const viewId = command.meta.viewIds[0];
    const { parentId } = command;
    if (id === undefined || viewId === undefined) return {};
    const { now } = command.meta;
    const props = {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      properties: [],
      viewIds: [viewId],
    };
    const record: Block = {
      id,
      type: DATABASE_TYPE,
      parentId,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    const index = siblingIds(state.workspace, parentId).length;
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: listOf(parentId), id, index },
        {
          type: "record.create",
          kind: "view",
          record: emptyView(viewId, id, DEFAULT_VIEW_NAME),
        },
      ],
      ui: { ...state.ui, activePageId: id },
    };
  },
});

function updateProperties(
  database: DatabaseBlock,
  properties: readonly PropertyDefinition[],
): Operation[] {
  const props = { ...database.props, properties: [...properties] };
  return [
    { type: "record.update", kind: "block", id: database.id, patch: { props } },
  ];
}

export interface AddPropertyPayload {
  readonly databaseId: BlockId;
  readonly propertyType: string;
  readonly name: string;
}

export const addProperty = defineCommand<AddPropertyPayload>({
  type: "property.add",
  newIds: { properties: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.propertyIds[0];
    if (database === undefined || id === undefined) return {};
    const property = { id, name: command.name, type: command.propertyType };
    return {
      operations: updateProperties(database, [
        ...database.props.properties,
        property,
      ]),
    };
  },
});

export interface ChangePropertyPayload {
  readonly databaseId: BlockId;
  readonly propertyId: PropertyId;
  readonly name?: string;
  readonly options?: readonly SelectOption[];
}

// Renames a property or replaces the choices of a select property.
export const changeProperty = defineCommand<ChangePropertyPayload>({
  type: "property.change",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const properties = database.props.properties.map((property) => {
      if (property.id !== command.propertyId) return property;
      return {
        ...property,
        ...(command.name !== undefined && { name: command.name }),
        ...(command.options !== undefined && { options: [...command.options] }),
      };
    });
    return { operations: updateProperties(database, properties) };
  },
});

// Removes a column. Cell values stay in the rows, unseen, so that undo and
// a later format can bring them back.
export const removeProperty = defineCommand<{
  databaseId: BlockId;
  propertyId: PropertyId;
}>({
  type: "property.remove",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined) return {};
    const properties = database.props.properties.filter(
      (property) => property.id !== command.propertyId,
    );
    if (properties.length === database.props.properties.length) return {};
    return { operations: updateProperties(database, properties) };
  },
});

// Adds an empty row, which is a page inside the database.
export const addRow = defineCommand<{ databaseId: BlockId }>({
  type: "row.add",
  newBlockIds: 1,
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.blockIds[0];
    if (database === undefined || id === undefined) return {};
    const { now } = command.meta;
    const props = {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values: {},
    };
    const record: Block = {
      id,
      type: PAGE_TYPE,
      parentId: database.id,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        {
          type: "list.insert",
          list: listOf(database.id),
          id,
          index: database.childIds.length,
        },
      ],
      ui: {
        ...state.ui,
        activeCell: { rowId: id, propertyId: null, isEditing: true },
      },
    };
  },
});

export interface SetRowValuePayload {
  readonly rowId: BlockId;
  readonly propertyId: PropertyId;
  // Undefined clears the cell.
  readonly value: unknown;
}

function isRowOfDatabase(state: AppState, rowId: BlockId): boolean {
  const row = selectPage(state, rowId);
  return row !== undefined && selectDatabase(state, row.parentId) !== undefined;
}

export const setRowValue = defineCommand<SetRowValuePayload>({
  type: "row.setValue",
  handle(state, command) {
    const row = selectPage(state, command.rowId);
    if (row === undefined || !isRowOfDatabase(state, command.rowId)) return {};
    const { [command.propertyId]: _previous, ...others } =
      row.props.values ?? {};
    const values =
      command.value === undefined
        ? others
        : { ...others, [command.propertyId]: command.value };
    const props = { ...row.props, values };
    const patch = { props, updatedAt: command.meta.now };
    return {
      operations: [{ type: "record.update", kind: "block", id: row.id, patch }],
    };
  },
});

export const databaseCommands = [
  createDatabase,
  addProperty,
  changeProperty,
  removeProperty,
  addRow,
  setRowValue,
];
