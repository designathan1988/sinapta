// Keys on a cell that act on its whole row: Shift+Space ticks the row,
// Ctrl+D fills the cell's column of the ticked rows with the first one's
// value, and Alt+Shift with Up or Down moves the row where rows keep the
// database's own order.
import type { BlockId } from "../../model/index.ts";
import { moveRow, selectRows, setRowValues } from "./row-bulk.commands.ts";
import { selectVisibleRows } from "./row-groups.selectors.ts";
import {
  selectCanReorder,
  selectTickedRows,
} from "./row-selection.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { CellRef } from "./table-cell-ref.ts";

const MOVES: Readonly<Record<string, number>> = {
  ArrowUp: -1,
  ArrowDown: 1,
};

function toggleTick(rowId: BlockId, context: TableContext): void {
  const ticked = context.state.ui.selectedRowIds;
  const rowIds = ticked.includes(rowId)
    ? ticked.filter((id) => id !== rowId)
    : [...ticked, rowId];
  context.dispatch(selectRows.create({ rowIds }));
}

function fillDown(cell: CellRef, context: TableContext): void {
  const { model, state, dispatch } = context;
  const { propertyId } = cell;
  const [first, ...rest] = selectTickedRows(state, model);
  if (propertyId === null || first === undefined || rest.length === 0) return;
  const source = model.rows.find((row) => row.id === first);
  const value = source?.values[propertyId];
  dispatch(setRowValues.create({ rowIds: rest, propertyId, value }));
}

function moveBy(rowId: BlockId, step: number, context: TableContext): void {
  if (!selectCanReorder(context.model)) return;
  const rows = selectVisibleRows(context.model);
  const index = rows.findIndex((row) => row.id === rowId);
  const neighbor = rows[index + step];
  if (index === -1 || neighbor === undefined) return;
  // Down goes before the row after the next one, or to the end.
  const beforeRowId = step < 0 ? neighbor.id : (rows[index + 2]?.id ?? null);
  context.dispatch(moveRow.create({ rowId, beforeRowId }));
}

// True when the key was one of these, used or not.
export function onRowKey(
  event: KeyboardEvent,
  cell: CellRef,
  context: TableContext,
): boolean {
  if (event.key === " " && event.shiftKey) {
    toggleTick(cell.rowId, context);
    return true;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
    fillDown(cell, context);
    return true;
  }
  const step = event.altKey && event.shiftKey ? MOVES[event.key] : undefined;
  if (step === undefined) return false;
  moveBy(cell.rowId, step, context);
  return true;
}
