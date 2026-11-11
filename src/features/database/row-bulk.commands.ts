// Commands on several rows at once, each one undo step: giving them a
// value, moving them to the trash and duplicating them; moving one row in
// the database's own order; and which rows are ticked, which is interface
// state.
import {
  planPageCopy,
  selectPageCopySize,
  type PageBlock,
  type PageCopySize,
} from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type BlockId,
  type Operation,
  type PropertyId,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandMeta,
} from "../../state/index.ts";
import { rowValueUpdate, selectRow } from "./row.commands.ts";

function rowsOf(state: AppState, rowIds: readonly BlockId[]): PageBlock[] {
  return rowIds.flatMap((id) => selectRow(state, id) ?? []);
}

export const setRowValues = defineCommand<{
  rowIds: readonly BlockId[];
  propertyId: PropertyId;
  // Undefined clears the cells.
  value: unknown;
}>({
  type: "row.setValueMany",
  handle: (state, command) => ({
    operations: rowsOf(state, command.rowIds).map((row) =>
      rowValueUpdate(row, command, command.meta.now),
    ),
  }),
});

export const deleteRows = defineCommand<{ rowIds: readonly BlockId[] }>({
  type: "row.deleteMany",
  handle(state, command) {
    const operations = rowsOf(state, command.rowIds)
      .filter((row) => !row.props.isTrashed)
      .map((row): Operation => {
        const props = { ...row.props, isTrashed: true };
        return {
          type: "record.update",
          kind: "block",
          id: row.id,
          patch: { props },
        };
      });
    const { activeCell } = state.ui;
    const isGone =
      activeCell !== null && command.rowIds.includes(activeCell.rowId);
    const ui = {
      ...state.ui,
      selectedRowIds: [],
      activeCell: isGone ? null : activeCell,
    };
    return { operations, ui };
  },
});

// How many new ids copies of the rows need, so the dispatcher can make
// them before the command runs.
export function selectRowsCopySize(
  state: AppState,
  rowIds: readonly BlockId[],
): PageCopySize {
  return rowsOf(state, rowIds).reduce(
    (total, row) => {
      const size = selectPageCopySize(state, row.id);
      return {
        blockCount: total.blockCount + size.blockCount,
        viewCount: total.viewCount + size.viewCount,
      };
    },
    { blockCount: 0, viewCount: 0 },
  );
}

interface RowCopy {
  readonly operations: readonly Operation[];
  readonly rootId: BlockId;
  readonly size: PageCopySize;
}

function sum(a: PageCopySize, b: PageCopySize): PageCopySize {
  return {
    blockCount: a.blockCount + b.blockCount,
    viewCount: a.viewCount + b.viewCount,
  };
}

// The records that copy one row, made with the new ids after `used`.
function copyOf(
  state: AppState,
  row: PageBlock,
  ids: { readonly meta: CommandMeta; readonly used: PageCopySize },
): RowCopy | undefined {
  const size = selectPageCopySize(state, row.id);
  const { meta, used } = ids;
  const next = sum(used, size);
  const blockIds = meta.blockIds.slice(used.blockCount, next.blockCount);
  const viewIds = meta.viewIds.slice(used.viewCount, next.viewCount);
  const plan = planPageCopy(state, row, {
    ...size,
    meta: { ...meta, blockIds, viewIds },
  });
  const root = plan?.records[0];
  if (plan === undefined || root === undefined) return undefined;
  const operations = [
    ...plan.records.map((record): Operation => ({
      type: "record.create",
      kind: "block",
      record,
    })),
    ...plan.views.map((record): Operation => ({
      type: "record.create",
      kind: "view",
      record,
    })),
  ];
  return { operations, rootId: root.id, size };
}

type DuplicatePayload = { rowIds: readonly BlockId[] } & PageCopySize;

function duplicate(
  state: AppState,
  command: DuplicatePayload & { readonly meta: CommandMeta },
): Operation[] | undefined {
  const operations: Operation[] = [];
  const lists = new Map<BlockId, readonly BlockId[]>();
  let used: PageCopySize = { blockCount: 0, viewCount: 0 };
  for (const row of rowsOf(state, command.rowIds)) {
    const copy = copyOf(state, row, { meta: command.meta, used });
    if (copy === undefined || row.parentId === null) return undefined;
    const list =
      lists.get(row.parentId) ?? siblingIds(state.workspace, row.parentId);
    const index = list.indexOf(row.id) + 1;
    lists.set(row.parentId, list.toSpliced(index, 0, copy.rootId));
    operations.push(...copy.operations, {
      type: "list.insert",
      list: listOf(row.parentId),
      id: copy.rootId,
      index,
    });
    used = sum(used, copy.size);
  }
  return operations;
}

// Puts a copy of each row, and of everything on its page, right after it.
export const duplicateRows = defineCommand<DuplicatePayload>({
  type: "row.duplicateMany",
  newIds: (payload) => ({
    blocks: payload.blockCount,
    views: payload.viewCount,
  }),
  handle(state, command) {
    const operations = duplicate(state, command);
    return operations === undefined ? {} : { operations };
  },
});

// Moves a row before another row of its database, or to the end on null.
export const moveRow = defineCommand<{
  rowId: BlockId;
  beforeRowId: BlockId | null;
}>({
  type: "row.move",
  handle(state, command) {
    const row = selectRow(state, command.rowId);
    if (row === undefined || row.parentId === null) return {};
    const siblings = siblingIds(state.workspace, row.parentId);
    const others = siblings.filter((id) => id !== row.id);
    const index =
      command.beforeRowId === null
        ? others.length
        : others.indexOf(command.beforeRowId);
    if (index === -1 || siblings.indexOf(row.id) === index) return {};
    const list = listOf(row.parentId);
    return {
      operations: [
        { type: "list.remove", list, id: row.id },
        { type: "list.insert", list, id: row.id, index },
      ],
    };
  },
});

export const selectRows = defineCommand<{ rowIds: readonly BlockId[] }>({
  type: "ui.selectRows",
  handle: (state, command) => ({
    ui: { ...state.ui, selectedRowIds: [...new Set(command.rowIds)] },
  }),
});

export const rowBulkCommands = [
  setRowValues,
  deleteRows,
  duplicateRows,
  moveRow,
  selectRows,
];
