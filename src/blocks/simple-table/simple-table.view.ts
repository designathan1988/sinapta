import "./simple-table.css";
import { html, type TemplateResult } from "lit-html";
import { plainText, type RichText } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { afterRender } from "../../ui/focus/index.ts";
import {
  insertTableColumn,
  insertTableRow,
  setTableCell,
} from "./simple-table.commands.ts";
import {
  renderTableMenu,
  SIMPLE_TABLE_MENU,
  tableMenuAnchorId,
} from "./simple-table-menu.view.ts";
import type { SimpleTableBlock } from "./simple-table.schema.ts";

export { SIMPLE_TABLE_MENU, tableMenuAnchorId };

interface CellPlace {
  readonly row: number;
  readonly column: number;
}

function placeOf(target: EventTarget | null): CellPlace | undefined {
  if (!(target instanceof HTMLElement) || !("row" in target.dataset)) {
    return undefined;
  }
  const { row, column } = target.dataset;
  return { row: Number(row), column: Number(column) };
}

function cellSelector(place: CellPlace): string {
  return `[data-row="${String(place.row)}"][data-column="${String(place.column)}"]`;
}

// Focuses a cell once the render that may add it has finished.
function focusCell(table: Element, place: CellPlace): void {
  afterRender(() => {
    table.querySelector<HTMLElement>(cellSelector(place))?.focus();
  });
}

function previousPlace(place: CellPlace, width: number) {
  const { row, column } = place;
  if (column > 0) return { row, column: column - 1 };
  return row > 0 ? { row: row - 1, column: width - 1 } : undefined;
}

// Tab goes to the next cell and Enter to the cell below; past the last
// row either one adds a row. Shift+Tab goes back; Shift+Enter breaks a
// line inside the cell.
function nextPlace(event: KeyboardEvent, place: CellPlace, width: number) {
  const { row, column } = place;
  if (event.key === "Enter" && !event.shiftKey) {
    return { row: row + 1, column };
  }
  if (event.key !== "Tab") return undefined;
  if (event.shiftKey) return previousPlace(place, width);
  return column + 1 < width
    ? { row, column: column + 1 }
    : { row: row + 1, column: 0 };
}

// A menu opened by a right click shows at the pointer.
interface MenuPlace extends CellPlace {
  readonly point?: { readonly x: number; readonly y: number };
}

function openMenu(
  block: SimpleTableBlock,
  place: MenuPlace,
  dispatch: Dispatch,
): void {
  const anchorId = tableMenuAnchorId(block.id, place.row, place.column);
  const { point } = place;
  const overlay = {
    kind: SIMPLE_TABLE_MENU,
    anchorId,
    ...(point && { point }),
  };
  dispatch(openOverlay.create({ overlay }));
}

function isMenuKey(event: KeyboardEvent): boolean {
  return event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
}

function onCellKey(
  event: KeyboardEvent,
  block: SimpleTableBlock,
  dispatch: Dispatch,
): void {
  const place = placeOf(event.target);
  const table = event.currentTarget;
  if (place === undefined || !(table instanceof Element)) return;
  if (isMenuKey(event)) {
    event.preventDefault();
    openMenu(block, place, dispatch);
    return;
  }
  const { rows } = block.props;
  const next = nextPlace(event, place, rows[0]?.length ?? 1);
  if (next === undefined) return;
  event.preventDefault();
  if (next.row >= rows.length) {
    dispatch(insertTableRow.create({ blockId: block.id, index: rows.length }));
  }
  focusCell(table, next);
}

function renderCell(
  cell: RichText,
  place: CellPlace,
  block: SimpleTableBlock,
): TemplateResult {
  const { row, column } = place;
  const { hasHeaderRow, hasHeaderColumn } = block.props;
  const isColumnHeader = hasHeaderRow && row === 0;
  const isRowHeader = hasHeaderColumn && column === 0;
  const { simpleTable } = COPY;
  const label = `${simpleTable.row} ${String(row + 1)}, ${simpleTable.column} ${String(column + 1)}`;
  const field = html`<textarea
    class="simple-table__cell"
    rows="1"
    aria-label=${label}
    data-row=${row}
    data-column=${column}
    .value=${plainText(cell)}
  ></textarea>`;
  if (!isColumnHeader && !isRowHeader) return html`<td>${field}</td>`;
  return html`<th scope=${isColumnHeader ? "col" : "row"}>${field}</th>`;
}

function renderAddButtons(
  block: SimpleTableBlock,
  dispatch: Dispatch,
): TemplateResult {
  const blockId = block.id;
  const { rows } = block.props;
  const height = rows.length;
  const width = rows[0]?.length ?? 1;
  return html`<button
      type="button"
      class="simple-table__add"
      data-axis="row"
      aria-label=${COPY.simpleTable.addRow}
      title=${tooltipTitle(COPY.simpleTable.addRow)}
      interestfor=${TOOLTIP_TARGET}
      @click=${() => dispatch(insertTableRow.create({ blockId, index: height }))}
    >
      +
    </button>
    <button
      type="button"
      class="simple-table__add"
      data-axis="column"
      aria-label=${COPY.simpleTable.addColumn}
      title=${tooltipTitle(COPY.simpleTable.addColumn)}
      interestfor=${TOOLTIP_TARGET}
      @click=${() =>
        dispatch(insertTableColumn.create({ blockId, index: width }))}
    >
      +
    </button>`;
}

// One text field per cell, each editing itself; the table listens for
// all of them.
function renderGrid(
  block: SimpleTableBlock,
  dispatch: Dispatch,
): TemplateResult {
  const blockId = block.id;
  const onInput = (event: Event): void => {
    const place = placeOf(event.target);
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    if (place === undefined) return;
    const text = event.target.value;
    dispatch(setTableCell.create({ blockId, ...place, text }));
  };
  const onContextMenu = (event: MouseEvent): void => {
    const place = placeOf(event.target);
    if (place === undefined) return;
    event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    openMenu(block, { ...place, point }, dispatch);
  };
  return html`<table
    class="simple-table__grid"
    aria-label=${COPY.simpleTable.label}
    @input=${onInput}
    @keydown=${(event: KeyboardEvent) => {
      onCellKey(event, block, dispatch);
    }}
    @contextmenu=${onContextMenu}
  >
    <tbody>
      ${block.props.rows.map(
        (cells, row) =>
          html`<tr>
            ${cells.map((cell, column) =>
              renderCell(cell, { row, column }, block),
            )}
          </tr>`,
      )}
    </tbody>
  </table>`;
}

export function renderSimpleTable(
  block: SimpleTableBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  return html`<div class="simple-table">
    <div class="simple-table__scroll">${renderGrid(block, dispatch)}</div>
    ${renderAddButtons(block, dispatch)}
    ${renderTableMenu(block, state, dispatch)}
  </div>`;
}
