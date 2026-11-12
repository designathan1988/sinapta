import "./sidebar.css";
import { html, type TemplateResult } from "lit-html";
import { createPage } from "../../blocks/page/index.ts";
import {
  openHome,
  selectIsHomeShown,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { createDatabase } from "../database/index.ts";
import { renderFavorites } from "./sidebar-favorites.view.ts";
import { renderSidebarFooter } from "./sidebar-footer.view.ts";
import { renderSidebarTop } from "./sidebar-top.view.ts";
import { renderTree } from "./sidebar-tree.view.ts";
import { selectTreeRows } from "./sidebar.selectors.ts";

interface QuickItem {
  readonly label: string;
  readonly icon: IconName;
  readonly onClick: () => void;
  readonly isCurrent?: boolean;
}

// A row of the sidebar's first group: an icon in its column, a label.
function renderQuick(item: QuickItem): TemplateResult {
  return html`<button
    type="button"
    class="sidebar__item"
    aria-current=${item.isCurrent === true ? "page" : "false"}
    @click=${item.onClick}
  >
    <span class="sidebar__icon" aria-hidden="true"
      >${renderIcon(item.icon)}</span
    >
    <span class="sidebar__title">${item.label}</span>
  </button>`;
}

// Home on its own, as Notion's, then the ways to start something new.
function renderQuickItems(state: AppState, dispatch: Dispatch): TemplateResult {
  return html`<div class="sidebar__quick">
      ${renderQuick({
        label: COPY.home.title,
        icon: "home",
        isCurrent: selectIsHomeShown(state),
        onClick: () => dispatch(openHome.create({})),
      })}
    </div>
    <div class="sidebar__quick">
      ${renderQuick({
        label: COPY.sidebar.newPage,
        icon: "compose",
        onClick: () => dispatch(createPage.create({ parentId: null })),
      })}
      ${renderQuick({
        label: COPY.database.newDatabase,
        icon: "table",
        onClick: () => dispatch(createDatabase.create({ parentId: null })),
      })}
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

// The sidebar, as Notion's: its top row and search field, then the rows
// and sections, which scroll, then its foot.
export function renderSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="sidebar">
    ${renderSidebarTop(state, dispatch)}
    <div class="sidebar__scroll">
      ${renderQuickItems(state, dispatch)} ${renderFavorites(state, dispatch)}
      ${renderPrivate(state, dispatch)}
    </div>
    ${renderSidebarFooter(state, dispatch)}
  </div>`;
}
