// The tabs of a database's views, as Notion's: the first three views and
// the open one, then "N more…" opening the others, then "+" for a new
// view.
import { html, nothing, type TemplateResult } from "lit-html";
import type { View, ViewId } from "../../model/index.ts";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { isOpenFor } from "./database-overlay.ts";
import type { TableContext } from "./table-cell.view.ts";
import { LAYOUT_ICONS } from "./view-settings/index.ts";
import { NEW_VIEW_OVERLAY } from "./view-layout.view.ts";
import { setActiveView } from "./view.commands.ts";

export const VIEW_TABS_OVERLAY = "view-tabs";

// How many tabs show before the others go under "N more…".
const SHOWN_TABS = 3;

// The views shown as tabs: the first ones, the open one in the last place
// when it is further on.
export function splitViews(
  viewIds: readonly ViewId[],
  activeId: ViewId,
): { readonly shown: ViewId[]; readonly more: ViewId[] } {
  const first = viewIds.slice(0, SHOWN_TABS);
  const shown = first.includes(activeId)
    ? first
    : [...first.slice(0, SHOWN_TABS - 1), activeId];
  return { shown, more: viewIds.filter((id) => !shown.includes(id)) };
}

function renderToggle(
  context: TableContext,
  button: { kind: string; label: string; content: TemplateResult },
): TemplateResult {
  const { state, dispatch, model } = context;
  const overlay = { kind: button.kind, anchorId: model.holderId };
  const isOpen = isOpenFor(state, overlay);
  return html`<button
    type="button"
    class="button database__more-views"
    data-variant="quiet"
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${button.label}
    title=${tooltipTitle(button.label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() =>
      dispatch(
        isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
      )}
  >
    ${button.content}
  </button>`;
}

function renderTab(view: View, context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const databaseId = model.holderId;
  return html`<button
    type="button"
    class="database__tab"
    aria-pressed=${String(view.id === model.view.id)}
    @click=${() => dispatch(setActiveView.create({ databaseId, viewId: view.id }))}
  >
    ${renderIcon(LAYOUT_ICONS[view.type])}
    <span>${view.name}</span>
  </button>`;
}

export function renderViewTabs(context: TableContext): TemplateResult {
  const { model, state } = context;
  const { shown, more } = splitViews(model.viewIds, model.view.id);
  const views = shown.flatMap((id) => state.workspace.views[id] ?? []);
  const moreLabel = COPY.database.moreViews(more.length);
  return html`<div
    class="database__tabs"
    role="group"
    aria-label=${COPY.database.views}
  >
    ${views.map((view) => renderTab(view, context))}
    ${
      more.length === 0
        ? nothing
        : renderToggle(context, {
            kind: VIEW_TABS_OVERLAY,
            label: moreLabel,
            content: html`${moreLabel}`,
          })
    }
    ${renderToggle(context, {
      kind: NEW_VIEW_OVERLAY,
      label: COPY.database.newView,
      content: renderIcon("plus"),
    })}
  </div>`;
}
