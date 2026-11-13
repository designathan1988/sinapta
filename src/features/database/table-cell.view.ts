import { OPEN_MODE_ICONS } from "./view-settings/index.ts";
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPage } from "../../blocks/page/index.ts";
import { ref } from "lit-html/directives/ref.js";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { afterRender, whenConnected } from "../../ui/focus/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { renderCellActions } from "./cell-actions.view.ts";
import { selectCellContext } from "./cell-context.selectors.ts";
import { selectCellColor } from "./row-color.selectors.ts";
import { editorOf, propertyType } from "./property-registry.ts";
import { setFrozenStart } from "./table-column-style.ts";
import type {
  TableColumn,
  TableModel,
  TableRow,
} from "./table-model.selectors.ts";

export const TITLE_KEY = "title";
export const CELL_OPTIONS_OVERLAY = "cell-options";
export const CELL_FILES_OVERLAY = "cell-files";
export const CELL_RELATION_OVERLAY = "cell-relation";
export const CELL_DATE_OVERLAY = "cell-date";

// The popover that edits a cell, for types not edited as text.
export const CELL_POPOVERS: Readonly<Record<string, string>> = {
  options: CELL_OPTIONS_OVERLAY,
  files: CELL_FILES_OVERLAY,
  relation: CELL_RELATION_OVERLAY,
  date: CELL_DATE_OVERLAY,
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

// The row's title and, as Notion's, an Open button showing where the row
// opens.
function renderTitle(row: TableRow, context: TableContext): TemplateResult {
  const mode = context.model.view.openMode;
  const label = COPY.database.openIn[mode];
  const icon = selectPage(context.state, row.id)?.props.icon ?? null;
  const showsIcon = context.model.view.table?.pageIcons !== false;
  return html`${
      showsIcon
        ? html`<span class="database__row-icon" aria-hidden="true"
            >${icon ?? renderIcon("page")}</span
          >`
        : nothing
    }<span class="database__title" ?data-untitled=${row.title === ""}
      >${row.title === "" ? COPY.sidebar.untitled : row.title}</span
    >
    <button
      type="button"
      class="database__open"
      tabindex="-1"
      data-action="open"
      aria-label=${label}
      title=${tooltipTitle(label)}
      interestfor=${TOOLTIP_TARGET}
    >
      ${renderIcon(OPEN_MODE_ICONS[mode])}
      <span>${COPY.database.open}</span>
    </button>`;
}

function renderValue(
  row: TableRow,
  column: TableColumn,
  context: TableContext,
): TemplateResult | string {
  if (column.isTitle) return renderTitle(row, context);
  const type = propertyType(column.property.type);
  const value = type.renderCell(
    type.read(row.values[column.property.id]),
    column.property,
    selectCellContext(context.state),
  );
  return isAddingFiles(row, column, context)
    ? html`${value}<span class="files__add"
          >${renderIcon("plus")}${COPY.database.addFileOrImage}</span
        >`
    : value;
}

// A files cell whose popover is open reads "+ Add file or image", as
// Notion's.
function isAddingFiles(
  row: TableRow,
  column: TableColumn,
  context: TableContext,
): boolean {
  const { overlay } = context.state.ui;
  return (
    column.property.type === "files" &&
    overlay?.kind === CELL_FILES_OVERLAY &&
    overlay.anchorId === `${row.id}:${column.property.id}`
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
  const editor = editorOf(column.property);
  return (
    column.isTitle ||
    (editor !== "toggle" &&
      editor !== "button" &&
      editor !== "none" &&
      CELL_POPOVERS[editor] === undefined)
  );
}

// Whether the cell is the active one, is being edited, and takes the
// focus: while a menu is open its fields keep the focus, and the cell takes
// it back once the menu closes.
export function cellState(row: TableRow, column: TableColumn, state: AppState) {
  const active = isActive(row, column, state);
  const isEditing =
    active && state.ui.activeCell?.isEditing === true && usesInput(column);
  const takesFocus = active && !isEditing && state.ui.overlay === null;
  return { active, isEditing, takesFocus };
}

export function renderCell(
  row: TableRow,
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { state } = context;
  const { active, isEditing, takesFocus } = cellState(row, column, state);
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
    data-color=${selectCellColor({ model: context.model, row, propertyId: column.property.id }, state) ?? nothing}
    ?data-active=${active}
    ?data-wrapped=${column.isWrapped === true}
    ?data-frozen=${column.frozenStart !== undefined}
    ${ref((element) => {
      setFrozenStart(element, column.frozenStart);
      if (takesFocus) focusCell(element);
    })}
  >
    ${
      isEditing
        ? renderEditor(editText(row, column), column)
        : html`${isAddingFiles(row, column, context) ? nothing : renderCellActions(row, column, context)}${renderValue(
            row,
            column,
            context,
          )}`
    }
  </td>`;
}
