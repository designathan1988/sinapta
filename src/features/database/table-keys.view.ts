// Turns pointer and keyboard events inside the table body into commands.
import { renamePage } from "../../blocks/page/index.ts";
import {
  openOverlay,
  setActivePage,
  type ActiveCell,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { setRowValue } from "./database.commands.ts";
import { propertyType } from "./property-registry.ts";
import { CELL_OPTIONS_OVERLAY, type TableContext } from "./table-cell.view.ts";
import { cellOf, columnOf, type CellRef } from "./table-cell-ref.ts";
import { setActiveCell, setTableFirstRow } from "./table.commands.ts";
import { selectCellNeighbor, type CellStep } from "./table.selectors.ts";

function activate(
  cell: CellRef,
  isEditing: boolean,
  context: TableContext,
): void {
  const { rowId, propertyId } = cell;
  context.dispatch(
    setActiveCell.create({ cell: { rowId, propertyId, isEditing } }),
  );
}

// Enter on a cell: edit it in the way its type is edited.
function startEditing(cell: CellRef, context: TableContext): void {
  const column = columnOf(cell, context);
  if (column === undefined) return;
  const { dispatch, model } = context;
  const { editor, read } = propertyType(column.property.type);
  if (column.isTitle || (editor !== "toggle" && editor !== "options")) {
    activate(cell, true, context);
  } else if (editor === "toggle" && cell.propertyId !== null) {
    const row = model.rows.find((item) => item.id === cell.rowId);
    const isChecked = read(row?.values[cell.propertyId]) === true;
    const value = isChecked ? undefined : true;
    dispatch(
      setRowValue.create({
        rowId: cell.rowId,
        propertyId: cell.propertyId,
        value,
      }),
    );
  } else {
    const overlay = { kind: CELL_OPTIONS_OVERLAY, anchorId: cell.key };
    dispatch(openOverlay.create({ overlay }));
  }
}

// Stores what an editor holds. Returns false when the text does not fit
// the property type, and leaves the editor open.
function commit(input: HTMLInputElement, context: TableContext): boolean {
  const cell = cellOf(input);
  const column = cell === undefined ? undefined : columnOf(cell, context);
  if (cell === undefined || column === undefined) return false;
  const text = input.value;
  if (cell.propertyId === null) {
    context.dispatch(renamePage.create({ pageId: cell.rowId, title: text }));
  } else {
    const value = propertyType(column.property.type).parse(text);
    if (value === undefined && text.trim() !== "") {
      input.setAttribute("aria-invalid", "true");
      announce(COPY.database.invalidValue);
      return false;
    }
    const { rowId, propertyId } = cell;
    context.dispatch(setRowValue.create({ rowId, propertyId, value }));
  }
  activate(cell, false, context);
  return true;
}

function onEditorKey(
  event: KeyboardEvent,
  input: HTMLInputElement,
  context: TableContext,
): void {
  const cell = cellOf(input);
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    commit(input, context);
  } else if (event.key === "Escape" && cell !== undefined) {
    // Marks the editor so that losing focus does not store its text.
    input.dataset.cancelled = "";
    event.preventDefault();
    activate(cell, false, context);
  }
  event.stopPropagation();
}

const ARROWS: Record<string, CellStep> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function moveActive(
  cell: ActiveCell,
  step: CellStep,
  context: TableContext,
): void {
  const { model, dispatch, state } = context;
  const next = selectCellNeighbor(model, cell, step);
  const index = model.rows.findIndex((row) => row.id === next.rowId);
  // Bring the row into the rendered window before it takes focus.
  if (Math.abs(index - state.ui.tableFirstRow) > 20) {
    dispatch(setTableFirstRow.create({ firstRow: index - 5 }));
  }
  dispatch(setActiveCell.create({ cell: next }));
}

function onCellKey(
  event: KeyboardEvent,
  cell: CellRef,
  context: TableContext,
): void {
  const step = ARROWS[event.key];
  const { rowId, propertyId } = cell;
  if (step !== undefined) {
    moveActive({ rowId, propertyId, isEditing: false }, step, context);
  } else if (event.key === "Enter" && event.altKey) {
    context.dispatch(setActivePage.create({ pageId: rowId }));
  } else if (event.key === "Enter" || event.key === "F2" || event.key === " ") {
    startEditing(cell, context);
  } else if (
    (event.key === "Delete" || event.key === "Backspace") &&
    propertyId !== null
  ) {
    context.dispatch(
      setRowValue.create({ rowId, propertyId, value: undefined }),
    );
  } else {
    return;
  }
  event.preventDefault();
}

export function onBodyKeyDown(
  event: KeyboardEvent,
  context: TableContext,
): void {
  const cell = cellOf(event.target);
  if (cell === undefined) return;
  if (event.target instanceof HTMLInputElement)
    onEditorKey(event, event.target, context);
  else onCellKey(event, cell, context);
}

function isActiveCell(cell: CellRef, context: TableContext): boolean {
  const active = context.state.ui.activeCell;
  return active?.rowId === cell.rowId && active.propertyId === cell.propertyId;
}

// Pressing a cell gives it focus, which makes it the active cell before
// the click arrives. Whether it was already active is noted here, so that
// only a press on the active cell starts editing.
export function onBodyPointerDown(
  event: PointerEvent,
  context: TableContext,
): void {
  const cell = cellOf(event.target);
  const element =
    event.target instanceof Element
      ? event.target.closest("[data-cell]")
      : null;
  if (cell !== undefined)
    element?.toggleAttribute(
      "data-pressed-active",
      isActiveCell(cell, context),
    );
}

export function onBodyClick(event: MouseEvent, context: TableContext): void {
  const cell = cellOf(event.target);
  const { target } = event;
  if (
    cell === undefined ||
    !(target instanceof Element) ||
    target instanceof HTMLInputElement
  ) {
    return;
  }
  if (target.closest("[data-action=open]") !== null) {
    context.dispatch(setActivePage.create({ pageId: cell.rowId }));
    return;
  }
  const wasActive = target.closest("[data-pressed-active]") !== null;
  // A press on the cell that was already active, or a double click, edits.
  if (wasActive || event.detail > 1) startEditing(cell, context);
  else activate(cell, false, context);
}

// Leaving an editor stores its text, unless Escape cancelled it.
export function onBodyFocusOut(event: FocusEvent, context: TableContext): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || "cancelled" in input.dataset)
    return;
  if (!input.isConnected) return;
  commit(input, context);
}

export function onBodyFocusIn(event: FocusEvent, context: TableContext): void {
  const cell = cellOf(event.target);
  if (cell === undefined || event.target instanceof HTMLInputElement) return;
  const active = context.state.ui.activeCell;
  if (active?.rowId === cell.rowId && active.propertyId === cell.propertyId)
    return;
  activate(cell, false, context);
}
