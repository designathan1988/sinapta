import "./sidebar.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  openHome,
  openOverlay,
  selectIsHomeShown,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  renderSidebarCustomize,
  SIDEBAR_CUSTOMIZE_OVERLAY,
} from "./sidebar-customize.view.ts";
import { renderFavorites } from "./sidebar-favorites.view.ts";
import { renderSidebarFooter } from "./sidebar-footer.view.ts";
import { sectionViewId } from "./sidebar-layout.selectors.ts";
import {
  selectSidebarTab,
  selectTabSections,
} from "./sidebar-tabs.selectors.ts";
import { renderSidebarTabs, renderUpcoming } from "./sidebar-tabs.view.ts";
import { renderShortcuts } from "./sidebar-shortcuts.view.ts";
import { renderSidebarTop } from "./sidebar-top.view.ts";
import { renderTree } from "./sidebar-tree.view.ts";
import { selectTreeRows } from "./sidebar.selectors.ts";
import { renderSidebarView } from "./sidebar-views.view.ts";

// Home on its own, as Notion's, above the shortcuts.
function renderHome(state: AppState, dispatch: Dispatch): TemplateResult {
  return html`<div class="sidebar__quick">
    <button
      type="button"
      class="sidebar__item"
      aria-current=${selectIsHomeShown(state) ? "page" : "false"}
      @click=${() => dispatch(openHome.create({}))}
    >
      <span class="sidebar__icon" aria-hidden="true"
        >${renderIcon("home")}</span
      >
      <span class="sidebar__title">${COPY.home.title}</span>
    </button>
  </div>`;
}

function renderPrivate(state: AppState, dispatch: Dispatch): TemplateResult {
  const rows = selectTreeRows(state);
  return html`<section class="sidebar__section">
    <h2 class="sidebar__heading" id="sidebar-private">
      ${COPY.sidebar.private}
    </h2>
    ${
      rows.length === 0
        ? html`<p class="sidebar__empty">${COPY.shell.emptyWorkspace}</p>`
        : renderTree(rows, { state, dispatch })
    }
  </section>`;
}

// The sections in the order "Customize sidebar" left them.
function renderSections(
  state: AppState,
  dispatch: Dispatch,
): (TemplateResult | typeof nothing)[] {
  const tab = selectSidebarTab(state);
  return selectTabSections(state, tab).map((key) => {
    if (key === "favorites") return renderFavorites(state, dispatch);
    if (key === "private") return renderPrivate(state, dispatch);
    const viewId = sectionViewId(state, key);
    return viewId === undefined
      ? nothing
      : renderSidebarView(state, dispatch, viewId);
  });
}

function renderCustomizeOpen(dispatch: Dispatch): TemplateResult {
  const overlay = { kind: SIDEBAR_CUSTOMIZE_OVERLAY };
  return html`<button
    type="button"
    class="sidebar__item sidebar__customize-open"
    @click=${() => dispatch(openOverlay.create({ overlay }))}
  >
    <span class="sidebar__icon" aria-hidden="true"
      >${renderIcon("sliders")}</span
    >
    <span class="sidebar__title">${COPY.sidebarCustomize.open}</span>
  </button>`;
}

function renderBody(state: AppState, dispatch: Dispatch): TemplateResult {
  if (state.ui.overlay?.kind === SIDEBAR_CUSTOMIZE_OVERLAY) {
    return html`${renderHome(state, dispatch)}
    ${renderSidebarCustomize(state, dispatch)}`;
  }
  const isCalendar = selectSidebarTab(state) === "calendar";
  return html`${renderSidebarTabs(state, dispatch)}
  ${isCalendar ? renderUpcoming(state, dispatch) : renderHome(state, dispatch)}
  ${isCalendar ? nothing : renderShortcuts(state, dispatch)}
  ${renderSections(state, dispatch)} ${renderCustomizeOpen(dispatch)}`;
}

// The sidebar, as Notion's: its top row and search field, then the rows
// and sections, which scroll, then its foot. While it is customized it is
// the open overlay, so a press inside it leaves the mode open.
export function renderSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const isCustomizing = state.ui.overlay?.kind === SIDEBAR_CUSTOMIZE_OVERLAY;
  return html`<div class="sidebar" ?data-overlay=${isCustomizing}>
    ${renderSidebarTop(state, dispatch)}
    <div class="sidebar__scroll">${renderBody(state, dispatch)}</div>
    ${renderSidebarFooter(state, dispatch)}
  </div>`;
}
