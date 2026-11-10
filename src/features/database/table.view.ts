import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { repeat } from "lit-html/directives/repeat.js";
import { COPY } from "../../ui/copy.ts";
import { renderCell, type TableContext } from "./table-cell.view.ts";
import { renderHeaderRow, setColumnWidth } from "./table-header.view.ts";
import {
  onBodyClick,
  onBodyFocusIn,
  onBodyFocusOut,
  onBodyKeyDown,
  onBodyPointerDown,
} from "./table-keys.view.ts";
import type { TableRow } from "./table-model.selectors.ts";
import { setTableFirstRow } from "./table.commands.ts";
import { selectRowWindow } from "./table.selectors.ts";

const SPACER_PROPERTY = "--database-spacer-rows";
// Scrolling by fewer rows than this does not move the window.
const SCROLL_STEP = 10;

function renderRow(
  row: TableRow,
  index: number,
  context: TableContext,
): TemplateResult {
  return html`<tr class="database__row" aria-rowindex=${index + 2}>
    ${context.model.columns.map((column) => renderCell(row, column, context))}
    <td class="database__cell" data-filler></td>
  </tr>`;
}

// A row that stands in for rows that are not rendered.
function renderSpacer(
  count: number,
  span: number,
): TemplateResult | typeof nothing {
  if (count === 0) return nothing;
  const setHeight = ref((element) => {
    if (element instanceof HTMLElement) {
      element.style.setProperty(SPACER_PROPERTY, String(count));
    }
  });
  return html`<tr class="database__spacer" aria-hidden="true" ${setHeight}>
    <td colspan=${span}></td>
  </tr>`;
}

function onScroll(event: Event, context: TableContext): void {
  const scroller = event.currentTarget;
  if (!(scroller instanceof HTMLElement)) return;
  const row = scroller.querySelector<HTMLElement>(".database__row");
  const rowHeight = row?.offsetHeight ?? 0;
  if (rowHeight === 0) return;
  const firstRow = Math.floor(scroller.scrollTop / rowHeight);
  if (Math.abs(firstRow - context.state.ui.tableFirstRow) >= SCROLL_STEP) {
    context.dispatch(setTableFirstRow.create({ firstRow }));
  }
}

function renderBody(context: TableContext): TemplateResult {
  const { model, state } = context;
  const span = model.columns.length + 1;
  const window = selectRowWindow(model.rows, state.ui.tableFirstRow);
  const on =
    <TEvent>(handler: (event: TEvent, context: TableContext) => void) =>
    (event: TEvent): void => {
      handler(event, context);
    };
  return html`<tbody
    @pointerdown=${on(onBodyPointerDown)}
    @click=${on(onBodyClick)}
    @keydown=${on(onBodyKeyDown)}
    @focusin=${on(onBodyFocusIn)}
    @focusout=${on(onBodyFocusOut)}
  >
    ${renderSpacer(window.before, span)}
    ${repeat(
      window.rows,
      (row) => row.id,
      (row, index) => renderRow(row, window.start + index, context),
    )}
    ${renderSpacer(window.after, span)}
  </tbody>`;
}

function renderColumns(context: TableContext): TemplateResult[] {
  return context.model.columns.map(
    (column) =>
      html`<col
        data-property-id=${column.property.id}
        ${ref((element) => {
          setColumnWidth(element, column.width);
        })}
      />`,
  );
}

// The table of a database view: a real table with grid semantics, so that
// arrow keys can move between its cells.
export function renderTable(context: TableContext): TemplateResult {
  const { model } = context;
  return html`<div
    class="database__scroll"
    @scroll=${(event: Event) => {
      onScroll(event, context);
    }}
  >
    <table
      class="database__table"
      role="grid"
      aria-label=${COPY.database.views}
      aria-rowcount=${model.rows.length + 1}
      aria-colcount=${model.columns.length}
    >
      <colgroup>
        ${renderColumns(context)}
        <col />
      </colgroup>
      <thead>
        ${renderHeaderRow(context)}
      </thead>
      ${renderBody(context)}
    </table>
  </div>`;
}
