// A list: one line per row, its title then the values of the view's
// visible properties; a grouped list shows its lines group by group.
import "./list.css";
import { html, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { setActivePage } from "../../../../state/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { renderGroupSection } from "../../group-section.view.ts";
import { propertyType } from "../../property-registry.ts";
import { selectRowGroups } from "../../row-groups.selectors.ts";
import { addRow } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";

function renderLine(row: TableRow, context: TableContext): TemplateResult {
  const values = context.model.columns.flatMap((column) => {
    if (column.isTitle) return [];
    const type = propertyType(column.property.type);
    const value = type.read(row.values[column.property.id]);
    if (value === undefined || value === false) return [];
    const cell = selectCellContext(context.state);
    const shown = type.renderCell(value, column.property, cell);
    return [html`<span>${shown}</span>`];
  });
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<li>
    <button
      type="button"
      class="list__row"
      @click=${() => context.dispatch(setActivePage.create({ pageId: row.id }))}
    >
      <span class="list__title" ?data-untitled=${row.title === ""}
        >${title}</span
      >
      <span class="list__values">${values}</span>
    </button>
  </li>`;
}

function renderLines(
  rows: readonly TableRow[],
  context: TableContext,
): TemplateResult {
  return html`<ul class="list__rows">
    ${repeat(
      rows,
      (row) => row.id,
      (row) => renderLine(row, context),
    )}
  </ul>`;
}

export function renderList(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const grouped = selectRowGroups(model);
  if (grouped !== undefined) {
    const content = (rows: readonly TableRow[]) => renderLines(rows, context);
    return html`<div class="list">
      ${grouped.groups.map((group) =>
        renderGroupSection({ grouped, group, content }, context),
      )}
    </div>`;
  }
  const databaseId = model.database.id;
  return html`<div class="list">
    ${renderLines(model.rows, context)}
    ${renderButton({
      label: COPY.database.newCard,
      icon: "plus",
      onClick: () => dispatch(addRow.create({ databaseId, opensPage: true })),
    })}
  </div>`;
}
