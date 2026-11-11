// Commands on the rows of a database: adding one and setting its values.
import { selectDatabase } from "../../blocks/database/index.ts";
import { PAGE_TYPE, selectPage } from "../../blocks/page/index.ts";
import {
  listOf,
  type Block,
  type BlockId,
  type PropertyId,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type UiState,
} from "../../state/index.ts";
import { numberNewRow } from "./row-numbering.ts";

export interface AddRowPayload {
  readonly databaseId: BlockId;
  // Cell values the row starts with, such as the group of the board
  // column it was added in.
  readonly values?: Readonly<Record<string, unknown>>;
  // Opens the new row as a page instead of editing its title in place.
  readonly opensPage?: boolean;
}

function afterAdd(state: AppState, id: BlockId, opensPage: boolean): UiState {
  return opensPage
    ? { ...state.ui, activePageId: id, activeCell: null }
    : {
        ...state.ui,
        activeCell: { rowId: id, propertyId: null, isEditing: true },
      };
}

// Adds a row, which is a page inside the database.
export const addRow = defineCommand<AddRowPayload>({
  type: "row.add",
  newBlockIds: 1,
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.blockIds[0];
    if (database === undefined || id === undefined) return {};
    const { now } = command.meta;
    const numbered = numberNewRow(database);
    const props = {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values: { ...command.values, ...numbered.values },
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
        ...numbered.operations,
      ],
      ui: afterAdd(state, id, command.opensPage === true),
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

export const rowCommands = [addRow, setRowValue];
