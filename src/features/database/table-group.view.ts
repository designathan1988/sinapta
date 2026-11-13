// The rows a grouped table adds around its rows: a group's header, and
// the row under its rows that adds a row with the group's value and
// shows the view's calculations over the group's rows.
import { html, nothing, type TemplateResult } from "lit-html";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { calculate, cappedCount } from "./calculations.selectors.ts";
import { renderGroupHeader } from "./group-header.view.ts";
import { addRowInGroup } from "./group-actions.ts";
import type { RowGroup } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableEntry } from "./table-entries.selectors.ts";
import type { TableColumn } from "./table-model.selectors.ts";

type GroupEntry = Exclude<TableEntry, { kind: "row" }>;

function renderResult(
  group: RowGroup,
  column: TableColumn,
  context: TableContext,
): TemplateResult | typeof nothing {
  const { property } = column;
  const kind = context.model.view.calculations[property.id];
  if (kind === undefined) return nothing;
  const label = COPY.database.rollupFunctions[kind];
  return html`<span class="database__calc-label">${label}</span>
    <span class="database__calc-value" data-property-id=${property.id}
      >${cappedCount(
        calculate(group.rows, property, kind),
        kind,
        context.model.view.countCap === true,
      )}</span
    >`;
}

function renderAddRow(group: RowGroup, context: TableContext): TemplateResult {
  const { model } = context;
  const add = (): void => {
    addRowInGroup(group, context);
  };
  const button = renderButton({
    label: COPY.database.newCard,
    icon: "plus",
    onClick: add,
  });
  const [first, ...rest] = model.columns;
  if (Object.keys(model.view.calculations).length === 0 || !first) {
    return html`<tr class="database__group-add" data-group-add=${group.key}>
      <td class="database__gutter"></td>
      <td colspan=${model.columns.length + 1}>${button}</td>
    </tr>`;
  }
  return html`<tr class="database__group-add" data-group-add=${group.key}>
    <td class="database__gutter"></td>
    <td class="database__calc">
      ${button} ${renderResult(group, first, context)}
    </td>
    ${rest.map(
      (column) =>
        html`<td class="database__calc">
          ${renderResult(group, column, context)}
        </td>`,
    )}
    <td class="database__calc" data-filler></td>
  </tr>`;
}

export function renderTableGroupEntry(
  entry: GroupEntry,
  context: TableContext,
): TemplateResult {
  const { group } = entry;
  if (entry.kind === "add") return renderAddRow(group, context);
  const span = context.model.columns.length + 2;
  return html`<tr class="database__group-row" data-group-key=${group.key}>
    <th colspan=${span} scope="rowgroup">
      ${renderGroupHeader(group, context)}
    </th>
  </tr>`;
}
