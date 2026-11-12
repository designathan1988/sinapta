// Under a table or a list: "New page", right under the last row, and how
// many rows the view shows, said to screen readers only, as Notion shows
// no count. A table puts "New page" in its own footer, above its
// calculations.
import { withDefaultTemplate } from "./template-default.commands.ts";
import { html, type TemplateResult } from "lit-html";
import { COPY, pluralize } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

// Layouts that list rows one under another end with this footer; boards,
// galleries and calendars add rows where they sit.
export const LISTED_LAYOUTS: ReadonlySet<string> = new Set(["table", "list"]);

export function renderAddRowButton(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const add = (): void => {
    dispatch(
      addRow.create(
        withDefaultTemplate(context.state, {
          databaseId: model.database.id,
          opensPage: model.view.type !== "table",
          viewId: model.view.id,
        }),
      ),
    );
  };
  return html`<button type="button" class="database__add-row" @click=${add}>
    ${renderIcon("plus")} <span>${COPY.database.newRow}</span>
  </button>`;
}

function countLabel(context: TableContext): string {
  const { model } = context;
  const shown = model.rows.length;
  if (shown === 0) {
    return model.totalRowCount === 0
      ? COPY.database.empty
      : COPY.database.noRows;
  }
  const count =
    shown === model.totalRowCount
      ? String(shown)
      : `${String(shown)} / ${String(model.totalRowCount)}`;
  return `${count} ${pluralize(model.totalRowCount, COPY.database.rowCount)}`;
}

export function renderFooter(context: TableContext): TemplateResult {
  const isTable = context.model.view.type === "table";
  const count = html`<span class="database__count visually-hidden" role="status"
    >${countLabel(context)}</span
  >`;
  if (isTable) return count;
  return html`<div class="database__footer">
    ${renderAddRowButton(context)} ${count}
  </div>`;
}
