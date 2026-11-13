import "./row-color.css";
import "./table.css";
import "./table-controls.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { repeat } from "lit-html/directives/repeat.js";
import { COPY } from "../../ui/copy.ts";
import { renderCell, type TableContext } from "./table-cell.view.ts";
import { onRowContextMenu } from "./table-context-menu.view.ts";
import { renderHeaderRow, setColumnWidth } from "./table-header.view.ts";
import {
  onBodyClick,
  onBodyFocusIn,
  onBodyFocusOut,
  onBodyKeyDown,
  onBodyPointerDown,
} from "./table-keys.view.ts";
import {
  selectTableEntries,
  type TableEntry,
} from "./table-entries.selectors.ts";
import { renderBulkBar } from "./table-bulk.view.ts";
import { renderTableFooter } from "./table-footer.view.ts";
import { renderRowGutter, startRowDrag } from "./table-gutter.view.ts";
import { renderTableGroupEntry } from "./table-group.view.ts";
import type { TableRow } from "./table-model.selectors.ts";
import { setTableFirstRow } from "./table.commands.ts";
import { selectRowWindow } from "./table.selectors.ts";
import { selectRowColor } from "./row-color.selectors.ts";

const SPACER_PROPERTY = "--database-spacer-rows";
// Scrolling by fewer rows than this does not move the window.
const SCROLL_STEP = 10;

function renderRow(
  row: TableRow,
  index: number,
  context: TableContext,
): TemplateResult {
  const isTicked = context.state.ui.selectedRowIds.includes(row.id);
  return html`<tr
    class="database__row"
    data-row-id=${row.id}
    ?data-ticked=${isTicked}
    ?data-peeked=${context.state.ui.peek?.pageId === row.id}
    data-color=${selectRowColor(context.model, row, context.state) ?? nothing}
    aria-rowindex=${index + 2}
  >
    ${renderRowGutter(row, context)}
    ${context.model.columns.map((column) => renderCell(row, column, context))}
    <td class="database__cell" data-filler></td>
  </tr>`;
}

function renderEntry(
  entry: TableEntry,
  index: number,
  context: TableContext,
): TemplateResult {
  return entry.kind === "row"
    ? renderRow(entry.row, index, context)
    : renderTableGroupEntry(entry, context);
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
  const span = model.columns.length + 2;
  const entries = selectTableEntries(model);
  const window = selectRowWindow(entries, state.ui.tableFirstRow);
  const on =
    <TEvent>(handler: (event: TEvent, context: TableContext) => void) =>
    (event: TEvent): void => {
      handler(event, context);
    };
  return html`<tbody
    @pointerdown=${(event: PointerEvent) => {
      onBodyPointerDown(event, context);
      startRowDrag(event, context);
    }}
    @click=${on(onBodyClick)}
    @keydown=${on(onBodyKeyDown)}
    @contextmenu=${(event: Event) => {
      onRowContextMenu(event, context.dispatch);
    }}
    @focusin=${on(onBodyFocusIn)}
    @focusout=${on(onBodyFocusOut)}
  >
    ${renderSpacer(window.before, span)}
    ${repeat(
      window.rows,
      (entry) => entry.key,
      (entry, index) => renderEntry(entry, window.start + index, context),
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
  return html`${renderBulkBar(context)}
    <div
      class="database__scroll"
      @scroll=${(event: Event) => {
        onScroll(event, context);
      }}
    >
      <table
        class="database__table"
        ?data-no-lines=${model.view.table?.verticalLines === false}
        role="grid"
        aria-label=${COPY.database.views}
        aria-rowcount=${selectTableEntries(model).length + 1}
        aria-colcount=${model.columns.length}
      >
        <colgroup>
          <col class="database__gutter-column" />
          ${renderColumns(context)}
          <col />
        </colgroup>
        <thead>
          ${renderHeaderRow(context)}
        </thead>
        ${renderBody(context)} ${renderTableFooter(context)}
      </table>
    </div>`;
}
