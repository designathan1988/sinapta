// The tabs of a database's views, as Notion's: the views that fit and the
// open one, then "N more…" opening the others, then "+" for a new view.
// Where the database is too narrow for tabs, the open view stands alone
// as a switch listing them all.
import { html, nothing, type TemplateResult } from "lit-html";
import type { View, ViewId, ViewTabStyle } from "../../model/index.ts";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { viewIsLocked } from "../../blocks/page/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { isOpenFor } from "./database-overlay.ts";
import type { TableContext } from "./table-cell.view.ts";
import { LAYOUT_ICONS } from "./view-settings/index.ts";
import { NEW_VIEW_OVERLAY } from "./view-layout.view.ts";
import { setActiveView } from "./view.commands.ts";

export const VIEW_TABS_OVERLAY = "view-tabs";
// The open view's own menu, from its tab.
export const VIEW_TAB_MENU_OVERLAY = "view-tab-menu";
// Every view, listed from the switch that stands for the tabs where they
// do not fit.
export const VIEW_LIST_OVERLAY = "view-list";

// The tab row's room beside the toolbar, and what one tab and "N more…"
// take of it, in characters of the 14 px interface text: a tab's icon,
// gap and padding come to about five. A database open as a page has the
// window's width; one inside a page has the page's 704 px column.
export type TabPlace = "page" | "inline";
const TAB_ROOM: Readonly<Record<TabPlace, number>> = { page: 100, inline: 64 };
const TAB_FRAME = 5;
const MORE_WIDTH = 9;
// A tab without its icon loses about two characters; one with only its
// icon takes about three.
const ICON_WIDTH = 2;
const ICON_ONLY_WIDTH = 3;

export interface TabLayout {
  readonly place: TabPlace;
  readonly style: ViewTabStyle;
}

function tabWidth(view: View, style: ViewTabStyle): number {
  if (style === "icon") return ICON_ONLY_WIDTH;
  const frame = style === "text" ? TAB_FRAME - ICON_WIDTH : TAB_FRAME;
  return view.name.length + frame;
}

// The views shown as tabs, as Notion's: every one when they all fit;
// otherwise the first that fit beside "N more…", and the open one in the
// last place when it is further on.
export function splitViews(
  views: readonly View[],
  activeId: ViewId,
  layout: TabLayout,
): { readonly shown: ViewId[]; readonly more: ViewId[] } {
  const { place, style } = layout;
  const width = (view: View): number => tabWidth(view, style);
  const ids = views.map((view) => view.id);
  const total = views.reduce((sum, view) => sum + width(view), 0);
  if (total <= TAB_ROOM[place]) return { shown: ids, more: [] };
  const active = views.find((view) => view.id === activeId);
  let room = TAB_ROOM[place] - MORE_WIDTH - (active ? width(active) : 0);
  const shown: ViewId[] = [];
  for (const view of views) {
    if (view.id === activeId) shown.push(view.id);
    else if (width(view) > room) break;
    else {
      room -= width(view);
      shown.push(view.id);
    }
  }
  if (active !== undefined && !shown.includes(activeId)) shown.push(activeId);
  return { shown, more: ids.filter((id) => !shown.includes(id)) };
}

// Where the database sits: open as the page, or inside one.
export function tabPlace(context: TableContext): TabPlace {
  const { model, state } = context;
  return model.holderId === state.ui.activePageId ? "page" : "inline";
}

// How tabs show, the owner's choice, and where they sit.
export function tabLayout(context: TableContext): TabLayout {
  const style = context.state.workspace.settings.viewTabStyle ?? "text-icon";
  return { place: tabPlace(context), style };
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

// A locked view's lock beside its name, as Notion's.
function renderTabLock(
  state: TableContext["state"],
  view: View,
): TemplateResult | typeof nothing {
  if (!viewIsLocked(state.workspace, view)) return nothing;
  return html`<span
    class="database__tab-lock"
    role="img"
    aria-label=${COPY.database.viewLocked}
    >${renderIcon("lock")}</span
  >`;
}

// A tab, as the owner chose to show tabs; the open view's tab opens its
// menu, as Notion's.
function renderTab(view: View, context: TableContext): TemplateResult {
  const { model, dispatch, state } = context;
  const databaseId = model.holderId;
  const style = tabLayout(context).style;
  const isActive = view.id === model.view.id;
  const menu = { kind: VIEW_TAB_MENU_OVERLAY, anchorId: databaseId };
  const isOpen = isActive && isOpenFor(state, menu);
  const onClick = (): void => {
    if (!isActive) {
      dispatch(setActiveView.create({ databaseId, viewId: view.id }));
      return;
    }
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: menu }),
    );
  };
  return html`<button
    type="button"
    class="database__tab"
    aria-pressed=${String(isActive)}
    aria-haspopup=${isActive ? "menu" : nothing}
    aria-expanded=${isActive ? String(isOpen) : nothing}
    aria-label=${style === "icon" ? view.name : nothing}
    title=${style === "icon" ? tooltipTitle(view.name) : nothing}
    interestfor=${style === "icon" ? TOOLTIP_TARGET : nothing}
    ?data-overlay-anchor=${isActive}
    data-style=${style}
    @click=${onClick}
  >
    ${style === "text" ? nothing : renderIcon(LAYOUT_ICONS[view.type])}
    ${style === "icon" ? nothing : html`<span>${view.name}</span>`}
    ${renderTabLock(state, view)}
  </button>`;
}

export function renderViewTabs(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state } = context;
  const all = model.viewIds.flatMap((id) => state.workspace.views[id] ?? []);
  const { shown, more } = splitViews(all, model.view.id, tabLayout(context));
  const views = all.filter((view) => shown.includes(view.id));
  const moreLabel = COPY.database.moreViews(more.length);
  const view = model.view;
  // Inside a page, one view shows no tab, only "+", as Notion's.
  if (all.length === 1 && tabPlace(context) === "inline") {
    return renderNewView(context);
  }
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
      ${renderNewView(context)}
    </div>`;
}

// A locked database takes no new view, as Notion's.
function renderNewView(context: TableContext): TemplateResult | typeof nothing {
  const database = context.state.workspace.blocks[context.model.database.id];
  if (database?.props.isLocked === true) return nothing;
  return renderToggle(context, {
    kind: NEW_VIEW_OVERLAY,
    label: COPY.database.newView,
    content: renderIcon("plus"),
  });
}
