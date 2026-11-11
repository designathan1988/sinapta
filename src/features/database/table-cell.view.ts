import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { afterRender, whenConnected } from "../../ui/focus/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { selectCellContext } from "./cell-context.selectors.ts";
import { propertyType } from "./property-registry.ts";
import type {
  TableColumn,
  TableModel,
  TableRow,
} from "./table-model.selectors.ts";

export const TITLE_KEY = "title";
export const CELL_OPTIONS_OVERLAY = "cell-options";
export const CELL_FILES_OVERLAY = "cell-files";
export const CELL_RELATION_OVERLAY = "cell-relation";

// The popover that edits a cell, for types not edited as text.
export const CELL_POPOVERS: Readonly<Record<string, string>> = {
  options: CELL_OPTIONS_OVERLAY,
  files: CELL_FILES_OVERLAY,
  relation: CELL_RELATION_OVERLAY,
};

export interface TableContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly model: TableModel;
}

export function cellKey(rowId: string, column: TableColumn): string {
  return `${rowId}:${column.isTitle ? TITLE_KEY : column.property.id}`;
}

function isActive(
  row: TableRow,
  column: TableColumn,
  state: AppState,
): boolean {
  const cell = state.ui.activeCell;
  if (cell?.rowId !== row.id) return false;
  return column.isTitle
    ? cell.propertyId === null
    : cell.propertyId === column.property.id;
}

// Gives focus to the active cell when the keyboard is in the table or
// nowhere, and never takes it from another control. It waits for the
// render to finish: the editor that had focus is removed after this runs.
function focusCell(element: Element | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  afterRender(() => {
    const current = document.activeElement;
    const isFree =
      current === document.body || current?.closest("[role=grid]") != null;
    if (isFree && current !== element && element.isConnected) element.focus();
  });
}

function focusEditor(element: Element | undefined): void {
  if (!(element instanceof HTMLInputElement)) return;
  whenConnected(element, () => {
    if (document.activeElement === element) return;
    element.focus();
    element.select();
  });
}

function renderEditor(value: string, column: TableColumn): TemplateResult {
  const { input } = propertyType(column.property.type);
  return html`<input
    class="database__input"
    type=${input?.type ?? "text"}
    inputmode=${input?.mode ?? nothing}
    aria-label=${column.property.name}
    .value=${value}
    ${ref(focusEditor)}
  />`;
}

function renderTitle(row: TableRow): TemplateResult {
  return html`<span class="database__title" ?data-untitled=${row.title === ""}
      >${row.title === "" ? COPY.sidebar.untitled : row.title}</span
    >
    <button
      type="button"
      class="database__open"
      tabindex="-1"
      data-action="open"
      aria-label=${COPY.database.openRow}
      title=${tooltipTitle(COPY.database.openRow)}
      interestfor=${TOOLTIP_TARGET}
    >
      ${renderIcon("chevron")}
    </button>`;
}

function renderValue(
  row: TableRow,
  column: TableColumn,
  context: TableContext,
): TemplateResult | string {
  if (column.isTitle) return renderTitle(row);
  const type = propertyType(column.property.type);
  return type.renderCell(
    type.read(row.values[column.property.id]),
    column.property,
    selectCellContext(context.state),
  );
}

// The text an editor starts with.
function editText(row: TableRow, column: TableColumn): string {
  if (column.isTitle) return row.title;
  const type = propertyType(column.property.type);
  return type.format(
    type.read(row.values[column.property.id]),
    column.property,
  );
}

function usesInput(column: TableColumn): boolean {
  const { editor } = propertyType(column.property.type);
  return (
    column.isTitle ||
    (editor !== "toggle" &&
      editor !== "button" &&
      editor !== "none" &&
      CELL_POPOVERS[editor] === undefined)
  );
}

export function renderCell(
  row: TableRow,
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { state } = context;
  const active = isActive(row, column, state);
  const isEditing =
    active && state.ui.activeCell?.isEditing === true && usesInput(column);
  const key = cellKey(row.id, column);
  const isAnchor = state.ui.overlay?.anchorId === key;
  // While its editor is open the cell itself is not a focus target.
  const tabIndex = isEditing ? nothing : active ? "0" : "-1";
  return html`<td
    class="database__cell"
    role="gridcell"
    tabindex=${tabIndex}
    data-cell=${key}
    data-type=${column.isTitle ? TITLE_KEY : column.property.type}
    data-overlay-anchor=${isAnchor ? "open" : nothing}
    ?data-active=${active}
    ${ref((element) => {
      if (active && !isEditing) focusCell(element);
    })}
  >
    ${isEditing ? renderEditor(editText(row, column), column) : renderValue(row, column, context)}
  </td>`;
}
