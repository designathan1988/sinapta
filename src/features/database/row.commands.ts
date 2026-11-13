// Commands on the rows of a database: adding one and setting its values.
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import {
  PAGE_TYPE,
  selectPage,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  listOf,
  type Block,
  type BlockId,
  type Operation,
  type PropertyId,
  type ViewId,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandMeta,
  type UiState,
} from "../../state/index.ts";
import { numberNewRow } from "./row-numbering.ts";
import { fromTemplate } from "./row-template.ts";

export interface AddRowPayload {
  readonly databaseId: BlockId;
  // Cell values the row starts with, such as the group of the board
  // column it was added in.
  readonly values?: Readonly<Record<string, unknown>>;
  // Opens the new row as a page instead of editing its title in place.
  readonly opensPage?: boolean;
  // The row's title, as a form's answer gives it.
  readonly title?: string;
  // Leaves the interface as it is, as a form that keeps taking answers.
  readonly staysPut?: boolean;
  // The template the row starts from: its values, icon and blocks.
  readonly template?: RowTemplate;
  // The row it goes right below, or above with `above`, as Notion's +
  // beside a row adds it; else it goes last.
  readonly besideId?: BlockId;
  readonly above?: boolean;
  // The view the row was added from: an opened row opens as it opens
  // rows, in its peek or as a page.
  readonly viewId?: ViewId;
}

export interface RowTemplate {
  readonly id: BlockId;
  // Blocks in the template's tree, the template included.
  readonly blockCount: number;
}

function afterAdd(
  state: AppState,
  id: BlockId,
  command: AddRowPayload,
): UiState {
  if (command.opensPage !== true) {
    const activeCell = { rowId: id, propertyId: null, isEditing: true };
    return { ...state.ui, activeCell };
  }
  const view =
    command.viewId === undefined
      ? undefined
      : state.workspace.views[command.viewId];
  if (view === undefined || view.openMode === "full") {
    return { ...state.ui, activePageId: id, activeCell: null };
  }
  const peek = { pageId: id, viewId: view.id, mode: view.openMode };
  return { ...state.ui, activeCell: null, peek };
}

interface PlainRow {
  readonly id: BlockId;
  readonly database: DatabaseBlock;
  readonly command: AddRowPayload & { readonly meta: CommandMeta };
  readonly values: Readonly<Record<string, unknown>>;
}

// A new, empty row with its title and values.
function plainRow(row: PlainRow): Block {
  const { now } = row.command.meta;
  const title = row.command.title?.trim().normalize("NFC") ?? "";
  const props = {
    title: title === "" ? [] : [{ text: title }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    values: row.values,
  };
  return {
    id: row.id,
    type: PAGE_TYPE,
    parentId: row.database.id,
    childIds: [],
    props,
    createdAt: now,
    updatedAt: now,
  };
}

function placeOf(rowIds: readonly BlockId[], command: AddRowPayload): number {
  const at =
    command.besideId === undefined ? -1 : rowIds.indexOf(command.besideId);
  if (at === -1) return rowIds.length;
  return command.above === true ? at : at + 1;
}

// Adds a row, which is a page inside the database.
export const addRow = defineCommand<AddRowPayload>({
  type: "row.add",
  newIds: (payload) => ({ blocks: payload.template?.blockCount ?? 1 }),
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const id = command.meta.blockIds[0];
    if (database === undefined || id === undefined) return {};
    const numbered = numberNewRow(database);
    const values = { ...command.values, ...numbered.values };
    const record = plainRow({ id, database, command, values });
    const records = fromTemplate(state, command, values) ?? [record];
    return {
      operations: [
        ...records.map((created): Operation => ({
          type: "record.create",
          kind: "block",
          record: created,
        })),
        {
          type: "list.insert",
          list: listOf(database.id),
          id,
          index: placeOf(database.childIds, command),
        },
        ...numbered.operations,
      ],
      ...(command.staysPut !== true && {
        ui: afterAdd(state, id, command),
      }),
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

// The update that gives a row a value; undefined clears the cell.
export function rowValueUpdate(
  row: PageBlock,
  change: ValueChange,
  now: string,
): Operation {
  return rowValuesUpdate(row, [change], now);
}

interface ValueChange {
  readonly propertyId: PropertyId;
  readonly value: unknown;
}

// One update giving a row several values, as a card moved to another
// column and lane takes both.
export function rowValuesUpdate(
  row: PageBlock,
  changes: readonly ValueChange[],
  now: string,
): Operation {
  const values = changes.reduce<Record<string, unknown>>((all, change) => {
    const { [change.propertyId]: _previous, ...others } = all;
    return change.value === undefined
      ? others
      : { ...others, [change.propertyId]: change.value };
  }, row.props.values ?? {});
  const props = { ...row.props, values };
  const patch = { props, updatedAt: now };
  return { type: "record.update", kind: "block", id: row.id, patch };
}

// The row, when it is a page of a database.
export function selectRow(
  state: AppState,
  rowId: BlockId,
): PageBlock | undefined {
  const row = selectPage(state, rowId);
  return row !== undefined && isRowOfDatabase(state, rowId) ? row : undefined;
}

export const setRowValue = defineCommand<SetRowValuePayload>({
  type: "row.setValue",
  handle(state, command) {
    const row = selectRow(state, command.rowId);
    if (row === undefined) return {};
    return {
      operations: [rowValueUpdate(row, command, command.meta.now)],
    };
  },
});

export const rowCommands = [addRow, setRowValue];
