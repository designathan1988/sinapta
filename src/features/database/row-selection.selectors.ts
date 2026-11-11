// Which rows of a table are ticked, as the table shows them.
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { selectVisibleRows } from "./row-groups.selectors.ts";
import type { TableModel } from "./table-model.selectors.ts";

// The rows from one row to another, both included, in the order shown;
// only the second when the first is not shown.
export function selectRowRange(
  model: TableModel,
  fromId: BlockId,
  toId: BlockId,
): BlockId[] {
  const rows = selectVisibleRows(model);
  const to = rows.findIndex((row) => row.id === toId);
  const from = rows.findIndex((row) => row.id === fromId);
  if (to === -1) return [];
  if (from === -1) return [toId];
  const [start, end] = from < to ? [from, to] : [to, from];
  return rows.slice(start, end + 1).map((row) => row.id);
}

// Rows are put in order by hand only where they keep the database's own
// order: no sort, no groups.
export function selectCanReorder(model: TableModel): boolean {
  return model.view.sorts.length === 0 && model.view.groupBy === undefined;
}

// The ticked rows the table shows, in the order shown.
export function selectTickedRows(
  state: AppState,
  model: TableModel,
): BlockId[] {
  const ticked = new Set(state.ui.selectedRowIds);
  return selectVisibleRows(model)
    .filter((row) => ticked.has(row.id))
    .map((row) => row.id);
}
