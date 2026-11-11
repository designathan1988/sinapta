// The header of a group of rows: one button that collapses or expands
// the group, showing its name, as a chip when it has a color, and how
// many rows it holds.
import { renderChip } from "../../ui/chip/index.ts";
import "./group.css";
import { html, type TemplateResult } from "lit-html";
import { renderIcon } from "../../ui/icon/index.ts";
import { toggleGroupCollapsed } from "./group.commands.ts";
import type { RowGroup } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

export function renderGroupHeader(
  group: RowGroup,
  context: TableContext,
): TemplateResult {
  const viewId = context.model.view.id;
  const name =
    group.color === undefined
      ? html`<span class="database__group-name">${group.label}</span>`
      : renderChip(group.label, group.color);
  return html`<button
    type="button"
    class="database__group-toggle"
    aria-expanded=${String(!group.isCollapsed)}
    @click=${() =>
      context.dispatch(toggleGroupCollapsed.create({ viewId, key: group.key }))}
  >
    ${renderIcon("chevron")} ${name}
    <span class="database__group-count">${group.rows.length}</span>
  </button>`;
}
