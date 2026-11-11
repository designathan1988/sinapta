// One group of a grouped list or gallery: its header, then, while it is
// open, its rows as the layout shows them and a button that adds a row
// with the group's value.
import { html, nothing, type TemplateResult } from "lit-html";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderGroupHeader } from "./group-header.view.ts";
import {
  groupValues,
  type GroupedRows,
  type RowGroup,
} from "./row-groups.selectors.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableRow } from "./table-model.selectors.ts";

export interface GroupSection {
  readonly grouped: GroupedRows;
  readonly group: RowGroup;
  // The group's rows as the layout shows them.
  readonly content: (rows: readonly TableRow[]) => TemplateResult;
}

export function renderGroupSection(
  section: GroupSection,
  context: TableContext,
): TemplateResult {
  const { grouped, group, content } = section;
  const add = (): void => {
    const databaseId = context.model.database.id;
    const values = groupValues(grouped, group.key);
    context.dispatch(addRow.create({ databaseId, values, opensPage: true }));
  };
  return html`<section
    class="database__group"
    data-group-key=${group.key}
    aria-label=${group.label}
  >
    <div class="database__group-header">
      ${renderGroupHeader(group, context)}
    </div>
    ${
      group.isCollapsed
        ? nothing
        : html`${content(group.rows)}
            <div class="database__group-add" data-group-add=${group.key}>
              ${renderButton({ label: COPY.database.newCard, icon: "plus", onClick: add })}
            </div>`
    }
  </section>`;
}
