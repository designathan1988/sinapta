// The start of each row: a box that ticks the row and, where rows keep
// the database's own order, a handle that drags the row. The header's box
// ticks every row shown. Alt+Shift with Up or Down on a cell moves a row
// from the keyboard, Shift+Space ticks it.
import { CHECKBOX_CLASS } from "../../ui/checkbox/index.ts";
import "./table-rows.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { startPointerDrag } from "../../ui/drag/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { moveRow, selectRows } from "./row-bulk.commands.ts";
import { addRow } from "./row.commands.ts";
import { selectVisibleRows } from "./row-groups.selectors.ts";
import {
  selectCanReorder,
  selectRowRange,
  selectTickedRows,
} from "./row-selection.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableRow } from "./table-model.selectors.ts";

function onTick(event: MouseEvent, row: TableRow, context: TableContext) {
  const { model, state, dispatch } = context;
  const ticked = state.ui.selectedRowIds;
  const anchor = ticked.at(-1);
  const isRange = event.shiftKey && anchor !== undefined;
  const rowIds = isRange
    ? [...new Set([...ticked, ...selectRowRange(model, anchor, row.id)])]
    : ticked.includes(row.id)
      ? ticked.filter((id) => id !== row.id)
      : [...ticked, row.id];
  dispatch(selectRows.create({ rowIds }));
}

// Notion's + beside a row: a new row right below it, above with Alt.
function renderAddBelow(row: TableRow, context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const add = (event: MouseEvent): void => {
    dispatch(
      addRow.create({
        databaseId: model.database.id,
        viewId: model.view.id,
        besideId: row.id,
        ...(event.altKey && { above: true }),
      }),
    );
  };
  return html`<button
    type="button"
    class="database__row-add-below"
    tabindex="-1"
    aria-label=${COPY.database.addRowBelow}
    title=${tooltipTitle(COPY.database.addRowBelow)}
    interestfor=${TOOLTIP_TARGET}
    @click=${add}
  >
    ${renderIcon("plus")}
  </button>`;
}

export function renderRowGutter(
  row: TableRow,
  context: TableContext,
): TemplateResult {
  const isTicked = context.state.ui.selectedRowIds.includes(row.id);
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<td class="database__gutter">
    <span class="database__gutter-tools">
      ${renderAddBelow(row, context)}
      ${
        selectCanReorder(context.model)
          ? html`<span
              class="database__row-handle"
              title=${COPY.database.moveRowHint}
              aria-hidden="true"
              >${renderIcon("grip")}</span
            >`
          : nothing
      }
      <input
        type="checkbox"
        class="database__row-check ${CHECKBOX_CLASS}"
        tabindex="-1"
        aria-label=${`${COPY.database.selectRow} ${title}`}
        .checked=${isTicked}
        @click=${(event: MouseEvent) => {
          onTick(event, row, context);
        }}
      />
    </span>
  </td>`;
}

export function renderGutterHeader(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const shown = selectVisibleRows(model);
  const ticked = selectTickedRows(state, model);
  const isAll = shown.length > 0 && ticked.length === shown.length;
  const toggleAll = (): void => {
    const rowIds = isAll ? [] : shown.map((row) => row.id);
    dispatch(selectRows.create({ rowIds }));
  };
  return html`<th class="database__gutter" scope="col">
    <input
      type="checkbox"
      class="database__row-check ${CHECKBOX_CLASS}"
      aria-label=${COPY.database.selectAllRows}
      .checked=${isAll}
      .indeterminate=${ticked.length > 0 && !isAll}
      @change=${toggleAll}
    />
  </th>`;
}

// A press on a row's handle starts dragging the row; it lands before or
// after the row it is dropped on.
export function startRowDrag(event: PointerEvent, context: TableContext) {
  const isHandle =
    event.target instanceof Element &&
    event.target.closest(".database__row-handle") !== null;
  if (!isHandle) return;
  startPointerDrag(event, {
    itemSelector: ".database__row",
    onDrop(source, target, position) {
      const rows = selectVisibleRows(context.model);
      const rowId = rows.find((row) => row.id === source.dataset.rowId)?.id;
      const at = rows.findIndex((row) => row.id === target.dataset.rowId);
      if (rowId === undefined || at === -1) return;
      const before = position === "after" ? rows[at + 1] : rows[at];
      const beforeRowId = before?.id ?? null;
      context.dispatch(moveRow.create({ rowId, beforeRowId }));
    },
  });
}
