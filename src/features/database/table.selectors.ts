// What the table shows of a model: the window of rows when it is long, and
// where the arrow keys take the active cell.
import type { ActiveCell } from "../../state/index.ts";
import type { TableModel, TableRow } from "./table-model.selectors.ts";

// Tables longer than this render only the rows near the viewport.
export const WINDOW_THRESHOLD = 200;
export const WINDOW_SIZE = 60;
const OVERSCAN = 15;

export interface RowWindow {
  readonly rows: readonly TableRow[];
  // Rows left out above and below, which spacers stand in for.
  readonly before: number;
  readonly after: number;
  // Index of the first rendered row in the whole list.
  readonly start: number;
}

export function selectRowWindow(
  rows: readonly TableRow[],
  firstRow: number,
): RowWindow {
  if (rows.length <= WINDOW_THRESHOLD) {
    return { rows, before: 0, after: 0, start: 0 };
  }
  const start = Math.max(
    0,
    Math.min(firstRow - OVERSCAN, rows.length - WINDOW_SIZE),
  );
  const end = Math.min(rows.length, start + WINDOW_SIZE);
  return {
    rows: rows.slice(start, end),
    before: start,
    after: rows.length - end,
    start,
  };
}

export type CellStep = "up" | "down" | "left" | "right";

const STEPS: Record<CellStep, readonly [row: number, column: number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

// The cell one step from the active one; the same cell at an edge.
export function selectCellNeighbor(
  model: TableModel,
  cell: ActiveCell,
  step: CellStep,
): ActiveCell {
  const rowIndex = model.rows.findIndex((row) => row.id === cell.rowId);
  const columnIndex = model.columns.findIndex((column) =>
    column.isTitle
      ? cell.propertyId === null
      : column.property.id === cell.propertyId,
  );
  const [rowStep, columnStep] = STEPS[step];
  const row = model.rows[rowIndex + rowStep] ?? model.rows[rowIndex];
  const column =
    model.columns[columnIndex + columnStep] ?? model.columns[columnIndex];
  if (row === undefined || column === undefined) return cell;
  const propertyId = column.isTitle ? null : column.property.id;
  return { rowId: row.id, propertyId, isEditing: false };
}
