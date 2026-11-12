// Under a table or a list: "New page", right under the last row, and how
// many rows the view shows.
import { withDefaultTemplate } from "./template-default.commands.ts";
import { html, type TemplateResult } from "lit-html";
import { COPY, pluralize } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

// Layouts that list rows one under another end with this footer; boards,
// galleries and calendars add rows where they sit.
export const LISTED_LAYOUTS: ReadonlySet<string> = new Set(["table", "list"]);

export function renderFooter(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const shown = model.rows.length;
  const count =
    shown === model.totalRowCount
      ? String(shown)
      : `${String(shown)} / ${String(model.totalRowCount)}`;
  const message =
    model.totalRowCount === 0 ? COPY.database.empty : COPY.database.noRows;
  const noun = pluralize(model.totalRowCount, COPY.database.rowCount);
  const add = (): void => {
    dispatch(
      addRow.create(
        withDefaultTemplate(context.state, {
          databaseId: model.database.id,
          opensPage: model.view.type !== "table",
          viewId: context.model.view.id,
        }),
      ),
    );
  };
  return html`<div class="database__footer">
    <button type="button" class="database__add-row" @click=${add}>
      ${renderIcon("plus")} <span>${COPY.database.newRow}</span>
    </button>
    <span class="database__count" role="status"
      >${shown === 0 ? message : `${count} ${noun}`}</span
    >
  </div>`;
}
