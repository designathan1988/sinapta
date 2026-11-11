// Editing a simple table: its cells, its rows and columns, and whether its
// first row and column are headers. Every change keeps the table a
// rectangle of at least one cell.
import {
  isBlockOfType,
  type BlockId,
  type Operation,
  type RichText,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import {
  emptyRow,
  SIMPLE_TABLE_TYPE,
  type SimpleTableBlock,
  type SimpleTableProps,
} from "./simple-table.schema.ts";

type Rows = readonly (readonly RichText[])[];

function tableOf(state: AppState, blockId: BlockId) {
  const block = state.workspace.blocks[blockId];
  return block !== undefined &&
    isBlockOfType<SimpleTableBlock>(block, SIMPLE_TABLE_TYPE)
    ? block
    : undefined;
}

function update(
  block: SimpleTableBlock,
  props: Partial<SimpleTableProps>,
  now: string,
): Operation[] {
  const patch = { props: { ...block.props, ...props }, updatedAt: now };
  return [{ type: "record.update", kind: "block", id: block.id, patch }];
}

// Runs a change of the rows on the table, if there is one and the change
// leaves a table.
function changeRows(
  state: AppState,
  command: { blockId: BlockId; meta: { now: string } },
  change: (rows: Rows) => Rows | undefined,
): CommandEffect {
  const block = tableOf(state, command.blockId);
  const rows = block === undefined ? undefined : change(block.props.rows);
  if (block === undefined || rows === undefined) return {};
  const copied = rows.map((row) => [...row]);
  return { operations: update(block, { rows: copied }, command.meta.now) };
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length, Math.trunc(index)));
}

export const setTableCell = defineCommand<{
  blockId: BlockId;
  row: number;
  column: number;
  text: string;
}>({
  type: "simpleTable.setCell",
  handle(state, command) {
    const { row, column } = command;
    const text = command.text.normalize("NFC");
    const cell: RichText = text === "" ? [] : [{ text }];
    const effect = changeRows(state, command, (rows) => {
      if (rows[row]?.[column] === undefined) return undefined;
      return rows.map((cells, at) =>
        at === row ? cells.map((old, c) => (c === column ? cell : old)) : cells,
      );
    });
    // Typing in one cell undoes as one step.
    const mergeKey = `simpleTable.cell:${command.blockId}:${String(row)}:${String(column)}`;
    return effect.operations === undefined ? effect : { ...effect, mergeKey };
  },
});

export const insertTableRow = defineCommand<{
  blockId: BlockId;
  index: number;
}>({
  type: "simpleTable.insertRow",
  handle: (state, command) =>
    changeRows(state, command, (rows) => {
      const at = clampIndex(command.index, rows.length);
      const row = emptyRow(rows[0]?.length ?? 1);
      return [...rows.slice(0, at), row, ...rows.slice(at)];
    }),
});

export const insertTableColumn = defineCommand<{
  blockId: BlockId;
  index: number;
}>({
  type: "simpleTable.insertColumn",
  handle: (state, command) =>
    changeRows(state, command, (rows) => {
      const at = clampIndex(command.index, rows[0]?.length ?? 0);
      return rows.map((row) => [...row.slice(0, at), [], ...row.slice(at)]);
    }),
});

export const removeTableRow = defineCommand<{
  blockId: BlockId;
  index: number;
}>({
  type: "simpleTable.removeRow",
  handle: (state, command) =>
    changeRows(state, command, (rows) =>
      rows.length <= 1 || rows[command.index] === undefined
        ? undefined
        : rows.filter((_, at) => at !== command.index),
    ),
});

export const removeTableColumn = defineCommand<{
  blockId: BlockId;
  index: number;
}>({
  type: "simpleTable.removeColumn",
  handle: (state, command) =>
    changeRows(state, command, (rows) => {
      const width = rows[0]?.length ?? 0;
      if (width <= 1 || command.index < 0 || command.index >= width) {
        return undefined;
      }
      return rows.map((row) => row.filter((_, at) => at !== command.index));
    }),
});

export const toggleTableHeader = defineCommand<{
  blockId: BlockId;
  axis: "row" | "column";
}>({
  type: "simpleTable.toggleHeader",
  handle(state, command) {
    const block = tableOf(state, command.blockId);
    if (block === undefined) return {};
    const key = command.axis === "row" ? "hasHeaderRow" : "hasHeaderColumn";
    const props = { [key]: !block.props[key] };
    return { operations: update(block, props, command.meta.now) };
  },
});

export const simpleTableCommands = [
  setTableCell,
  insertTableRow,
  insertTableColumn,
  removeTableRow,
  removeTableColumn,
  toggleTableHeader,
];
