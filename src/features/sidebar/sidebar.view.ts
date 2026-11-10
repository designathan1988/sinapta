import "./sidebar.css";
import { html, type TemplateResult } from "lit-html";
import { createPage } from "../../blocks/page/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
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
    label: COPY.trash.open,
    icon: "trash",
    onClick: () =>
      dispatch(openOverlay.create({ overlay: { kind: TRASH_OVERLAY } })),
  })}`;
}

// The sidebar panel: favorites, the page tree and its actions.
export function renderSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const rows = selectTreeRows(state);
  return html`<div class="sidebar">
    ${renderFavorites(state, dispatch)}
    ${
      rows.length === 0
        ? html`<p class="sidebar__empty">${COPY.shell.emptyWorkspace}</p>`
        : renderTree(rows, { state, dispatch })
    }
    ${renderFooter(dispatch)}
  </div>`;
}
