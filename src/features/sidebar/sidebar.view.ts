import "./sidebar.css";
import { html, type TemplateResult } from "lit-html";
import { createPage } from "../../blocks/page/index.ts";
import {
  openHome,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  PALETTE_OVERLAY_KIND,
  SETTINGS_OVERLAY_KIND,
} from "../../ui/shortcuts/index.ts";
import { createDatabase } from "../database/index.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";
import { renderFavorites } from "./sidebar-favorites.view.ts";
import { renderTree } from "./sidebar-tree.view.ts";
import { selectTreeRows } from "./sidebar.selectors.ts";

function renderFooter(dispatch: Dispatch): TemplateResult {
  return html`${renderButton({
    label: COPY.sidebar.newPage,
    icon: "plus",
    onClick: () => dispatch(createPage.create({ parentId: null })),
  })}
  ${renderButton({
    label: COPY.database.newDatabase,
    icon: "plus",
    onClick: () => dispatch(createDatabase.create({ parentId: null })),
  })}
  ${renderButton({
    label: COPY.trash.open,
    icon: "trash",
    onClick: () =>
      dispatch(openOverlay.create({ overlay: { kind: TRASH_OVERLAY } })),
  })}`;
}

// Places to go that are not pages: search and settings.
function renderQuickItems(dispatch: Dispatch): TemplateResult {
  const open = (kind: string) => () =>
    dispatch(openOverlay.create({ overlay: { kind } }));
  return html`<div class="sidebar__quick">
    ${renderButton({
      label: COPY.home.title,
      icon: "home",
      onClick: () => dispatch(openHome.create({})),
    })}
    ${renderButton({
      label: COPY.sidebar.search,
      icon: "search",
      onClick: open(PALETTE_OVERLAY_KIND),
    })}
    ${renderButton({
      label: COPY.shell.openSettings,
      icon: "settings",
      onClick: open(SETTINGS_OVERLAY_KIND),
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

// The sidebar panel: quick items, favorites, the page tree and actions.
export function renderSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="sidebar">
    ${renderQuickItems(dispatch)} ${renderFavorites(state, dispatch)}
    ${renderPrivate(state, dispatch)} ${renderFooter(dispatch)}
  </div>`;
}
