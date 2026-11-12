// The tabs of a database's views, as Notion's: the views that fit and the
// open one, then "N more…" opening the others, then "+" for a new view.
// Where the database is too narrow for tabs, the open view stands alone
// as a switch listing them all.
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
// Every view, listed from the switch that stands for the tabs where they
// do not fit.
export const VIEW_LIST_OVERLAY = "view-list";

// The tab row's room beside the toolbar, and what one tab and "N more…"
// take of it, in characters of the 14 px interface text: a tab's icon,
// gap and padding come to about five.
const TAB_ROOM = 64;
const TAB_FRAME = 5;
const MORE_WIDTH = 9;

function tabWidth(view: View): number {
  return view.name.length + TAB_FRAME;
}

// The views shown as tabs, as Notion's: every one when they all fit;
// otherwise the first that fit beside "N more…", and the open one in the
// last place when it is further on.
export function splitViews(
  views: readonly View[],
  activeId: ViewId,
): { readonly shown: ViewId[]; readonly more: ViewId[] } {
  const ids = views.map((view) => view.id);
  const total = views.reduce((sum, view) => sum + tabWidth(view), 0);
  if (total <= TAB_ROOM) return { shown: ids, more: [] };
  const active = views.find((view) => view.id === activeId);
  let room = TAB_ROOM - MORE_WIDTH - (active ? tabWidth(active) : 0);
  const shown: ViewId[] = [];
  for (const view of views) {
    if (view.id === activeId) shown.push(view.id);
    else if (tabWidth(view) > room) break;
    else {
      room -= tabWidth(view);
      shown.push(view.id);
    }
  }
  if (active !== undefined && !shown.includes(activeId)) shown.push(activeId);
  return { shown, more: ids.filter((id) => !shown.includes(id)) };
}

interface ToggleButton {
  readonly kind: string;
  readonly label: string;
  readonly content: TemplateResult;
  // The button's class within the database; "more views" by default.
  readonly part?: string;
}

function renderToggle(
  context: TableContext,
  button: ToggleButton,
): TemplateResult {
  const { state, dispatch, model } = context;
  const overlay = { kind: button.kind, anchorId: model.holderId };
  const isOpen = isOpenFor(state, overlay);
  return html`<button
    type="button"
    class="button ${button.part ?? "database__more-views"}"
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
  const all = model.viewIds.flatMap((id) => state.workspace.views[id] ?? []);
  const { shown, more } = splitViews(all, model.view.id);
  const views = all.filter((view) => shown.includes(view.id));
  const moreLabel = COPY.database.moreViews(more.length);
  const view = model.view;
  return html`${renderToggle(context, {
      kind: VIEW_LIST_OVERLAY,
      label: view.name,
      part: "database__switch",
      content: html`${renderIcon(LAYOUT_ICONS[view.type])}
        <span>${view.name}</span>${renderIcon("chevron")}`,
    })}
    <div class="database__tabs" role="group" aria-label=${COPY.database.views}>
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
