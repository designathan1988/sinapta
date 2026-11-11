// What the table shows of a model: the window of rows when it is long, and
// where the arrow keys take the active cell.
import type { PropertyId } from "../../model/index.ts";
import type { ActiveCell } from "../../state/index.ts";
import { selectVisibleRows } from "./row-groups.selectors.ts";
import type { TableModel, TableRow } from "./table-model.selectors.ts";

// Tables longer than this render only the rows near the viewport.
export const WINDOW_THRESHOLD = 200;
export const WINDOW_SIZE = 60;
const OVERSCAN = 15;

export interface RowWindow<TItem = TableRow> {
  readonly rows: readonly TItem[];
  // Rows left out above and below, which spacers stand in for.
  readonly before: number;
  readonly after: number;
  // Index of the first rendered row in the whole list.
  readonly start: number;
}

export function selectRowWindow<TItem>(
  rows: readonly TItem[],
  firstRow: number,
): RowWindow<TItem> {
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

// The cell one step from the active one, in the order the table shows
// rows; the same cell at an edge.
export function selectCellNeighbor(
  model: TableModel,
  cell: ActiveCell,
  step: CellStep,
): ActiveCell {
  const rows = selectVisibleRows(model);
  const rowIndex = rows.findIndex((row) => row.id === cell.rowId);
  const columnIndex = model.columns.findIndex((column) =>
    column.isTitle
      ? cell.propertyId === null
      : column.property.id === cell.propertyId,
  );
  const [rowStep, columnStep] = STEPS[step];
  const row = rows[rowIndex + rowStep] ?? rows[rowIndex];
  const column =
    model.columns[columnIndex + columnStep] ?? model.columns[columnIndex];
  if (row === undefined || column === undefined) return cell;
  const propertyId = column.isTitle ? null : column.property.id;
  return { rowId: row.id, propertyId, isEditing: false };
}

export interface ColumnDrop {
  readonly sourceId: string;
  readonly targetId: string;
  readonly position: "before" | "after" | "inside";
}

// The property order after one column is dropped beside another, or
// undefined when the drop changes nothing. The title column stays first:
// it cannot be moved, and a drop on it lands right after it.
export function selectColumnDrop(
  model: TableModel,
  drop: ColumnDrop,
): readonly PropertyId[] | undefined {
  const movable = model.columns.filter((column) => !column.isTitle);
  const order = movable.map((column) => column.property.id);
  const source = order.find((id) => id === drop.sourceId);
  if (source === undefined || drop.sourceId === drop.targetId) return undefined;
  const rest = order.filter((id) => id !== source);
  const target = rest.findIndex((id) => id === drop.targetId);
  const index =
    target === -1 ? 0 : target + (drop.position === "before" ? 0 : 1);
  const next = rest.toSpliced(index, 0, source);
  return next.every((id, at) => id === order[at]) ? undefined : next;
}
