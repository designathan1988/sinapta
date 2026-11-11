// The rows a grouped table adds around its rows: a group's header, and
// the row under its rows that adds a row with the group's value.
import { html, type TemplateResult } from "lit-html";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderGroupHeader } from "./group-header.view.ts";
import { groupValues, selectRowGroups } from "./row-groups.selectors.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableEntry } from "./table-entries.selectors.ts";

type GroupEntry = Exclude<TableEntry, { kind: "row" }>;

export function renderTableGroupEntry(
  entry: GroupEntry,
  context: TableContext,
): TemplateResult {
  const { model, dispatch } = context;
  const span = model.columns.length + 1;
  const { group } = entry;
  if (entry.kind === "group") {
    return html`<tr class="database__group-row" data-group-key=${group.key}>
      <th colspan=${span} scope="rowgroup">
        ${renderGroupHeader(group, context)}
      </th>
    </tr>`;
  }
  const add = (): void => {
    const grouped = selectRowGroups(model);
    const values = grouped === undefined ? {} : groupValues(grouped, group.key);
    const databaseId = model.database.id;
    dispatch(addRow.create({ databaseId, values, opensPage: true }));
  };
  return html`<tr class="database__group-add" data-group-add=${group.key}>
    <td colspan=${span}>
      ${renderButton({ label: COPY.database.newCard, icon: "plus", onClick: add })}
    </td>
  </tr>`;
}
