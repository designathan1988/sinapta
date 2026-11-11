// The header of a group of rows: a button that collapses or expands the
// group, showing its name, as a chip when it has a color, and how many
// rows it holds; then, as the pointer rests on it, Notion's "…" for the
// group's menu and "+" for a new row in the group.
import { renderChip } from "../../ui/chip/index.ts";
import "./group.css";
import { html, type TemplateResult } from "lit-html";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  addRowInGroup,
  GROUP_MENU_OVERLAY,
  groupMenuAnchor,
} from "./group-actions.ts";
import { toggleGroupCollapsed } from "./group.commands.ts";
import type { RowGroup } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

function renderActions(group: RowGroup, context: TableContext) {
  const { state, dispatch, model } = context;
  const anchorId = groupMenuAnchor(model.holderId, group.key);
  const open = state.ui.overlay;
  const isOpen =
    open?.kind === GROUP_MENU_OVERLAY && open.anchorId === anchorId;
  const overlay = { kind: GROUP_MENU_OVERLAY, anchorId };
  const toggle = (): void => {
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
    );
  };
  return html`<span class="database__group-actions" ?data-open=${isOpen}>
    <button
      type="button"
      class="database__group-action"
      aria-label=${COPY.database.groupActions(group.label)}
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      data-overlay-anchor
      @click=${toggle}
    >
      ${renderIcon("more")}
    </button>
    <button
      type="button"
      class="database__group-action"
      aria-label=${COPY.database.newInGroup(group.label)}
      @click=${() => {
        addRowInGroup(group, context);
      }}
    >
      ${renderIcon("plus")}
    </button>
  </span>`;
}

export function renderGroupHeader(
  group: RowGroup,
  context: TableContext,
): TemplateResult {
  const viewId = context.model.view.id;
  const name =
    group.color === undefined
      ? html`<span class="database__group-name">${group.label}</span>`
      : renderChip(group.label, group.color);
  return html`<div class="database__group-head">
    <button
      type="button"
      class="database__group-toggle"
      aria-expanded=${String(!group.isCollapsed)}
      @click=${() =>
        context.dispatch(
          toggleGroupCollapsed.create({ viewId, key: group.key }),
        )}
    >
      ${renderIcon("chevron")} ${name}
      <span class="database__group-count">${group.rows.length}</span>
    </button>
    ${renderActions(group, context)}
  </div>`;
}
