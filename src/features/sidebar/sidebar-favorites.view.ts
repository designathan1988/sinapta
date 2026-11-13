import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectFavoritePages,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";

// Favorite pages, listed above the tree for quick access; as many as
// "Customize sidebar" › Show says.
export function renderFavorites(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const limit = state.workspace.settings.favoritesLimit;
  const pages = selectFavoritePages(state).slice(0, limit);
  if (pages.length === 0) return nothing;
  const items = pages.map((page) => {
    const title = selectPageTitle(page);
    return html`<li>
      <button
        type="button"
        class="sidebar__item"
        aria-current=${state.ui.activePageId === page.id ? "page" : nothing}
        @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
      >
        <span class="sidebar__icon" aria-hidden="true"
          >${page.props.icon ?? renderIcon("page")}</span
        >
        <span class="sidebar__title"
          >${title === "" ? COPY.sidebar.untitled : title}</span
        >
      </button>
    </li>`;
  });
  return html`<section class="sidebar__section">
    <h2 class="sidebar__heading" id="sidebar-favorites">
      ${COPY.favorites.heading}
    </h2>
    <ul aria-labelledby="sidebar-favorites">
      ${items}
    </ul>
  </section>`;
}
