import "./page-menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectPage,
  togglePageFavorite,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setOverlayQuery,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  renderMenu,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import { selectEditedLabel, wordCountLabel } from "../page-info/index.ts";
import { grouped, pageMenuEntries } from "./page-menu-entries.ts";
import {
  pageIdOfAnchor,
  pageMenuAnchorId,
  placeOfAnchor,
  TREE_PLACE,
} from "./page-menu-anchor.ts";
import { renameItem } from "./page-rename.view.ts";
import {
  MOVE_TO_FROM,
  MOVE_TO_OVERLAY_KIND,
  pageActionItems,
} from "./page-menu-items.ts";

export const PAGE_MENU_OVERLAY = "page-menu";
export { pageMenuAnchorId, TREE_PLACE } from "./page-menu-anchor.ts";

export interface PageMenuButtonOptions {
  readonly place: string;
  readonly pageId: BlockId;
  // False inside a composite widget that manages focus itself.
  readonly isTabStop?: boolean;
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

export function renderPageMenuButton(
  options: PageMenuButtonOptions,
): TemplateResult {
  const { state, dispatch } = options;
  const anchorId = pageMenuAnchorId(options.place, options.pageId);
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === PAGE_MENU_OVERLAY && overlay.anchorId === anchorId;
  // Move to, opened from this button's menu, stays anchored to it.
  const isMoveFromHere =
    overlay?.kind === MOVE_TO_OVERLAY_KIND &&
    overlay.values?.[MOVE_TO_FROM]?.[0] === anchorId;
  const onClick = (event: Event): void => {
    event.stopPropagation();
    dispatch(
      isOpen
        ? closeOverlay.create({})
        : openOverlay.create({
            overlay: { kind: PAGE_MENU_OVERLAY, anchorId },
          }),
    );
  };
  return html`<button
    type="button"
    class="page-menu__button"
    data-place=${options.place}
    tabindex=${options.isTabStop === false ? "-1" : "0"}
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen || isMoveFromHere)}
    aria-label=${COPY.pageMenu.open}
    title=${tooltipTitle(COPY.pageMenu.open)}
    interestfor=${TOOLTIP_TARGET}
    @click=${onClick}
  >
    ${renderIcon("more")}
  </button>`;
}

function favoriteItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const pageId = page.id;
  return {
    label: page.props.isFavorite
      ? COPY.pageMenu.removeFavorite
      : COPY.pageMenu.addFavorite,
    icon: "star",
    onSelect: () => dispatch(togglePageFavorite.create({ pageId })),
  };
}

// The sidebar's shorter menu, as Notion's: favorite, then what acts on
// the page; its style and files are the open page's own menu.
function treeEntries(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuEntry[] {
  const actions = pageActionItems(state, page.id, dispatch);
  // Notion's order: copy link, duplicate, rename, move to, the trash.
  actions.splice(2, 0, renameItem(page.id, dispatch));
  return grouped([[favoriteItem(page, dispatch)], actions]);
}

// What the menu holds where it opened: the sidebar's short menu with the
// page's last edit, as Notion's; elsewhere every group, with the last
// edit and the word count.
function menuParts(state: AppState, page: PageBlock, dispatch: Dispatch) {
  const anchorId = state.ui.overlay?.anchorId;
  if (placeOfAnchor(anchorId) === TREE_PLACE) {
    return {
      items: treeEntries(state, page, dispatch),
      footer: selectEditedLabel(state, page.id, new Date().toISOString()),
    };
  }
  // Notion's foot: when the page was last edited, then its word count.
  const edited = selectEditedLabel(state, page.id, new Date().toISOString());
  return {
    items: pageMenuEntries(state, page, dispatch),
    footer: `${edited}
${wordCountLabel(state, page.id)}`,
  };
}

// The open page menu, if any. Rendered once, at the shell.
export function renderPageMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.kind !== PAGE_MENU_OVERLAY) return nothing;
  const page = selectPage(state, pageIdOfAnchor(overlay.anchorId) ?? null);
  if (page === undefined) return nothing;
  return renderMenu({
    label: COPY.pageMenu.open,
    ...menuParts(state, page, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
    // Its rows open submenus beside them: appearance, more, export.
    context: { overlay, dispatch },
    search: {
      placeholder: COPY.menu.searchActions,
      query: overlay.query ?? "",
      onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
    },
    ...(overlay.point && { point: overlay.point }),
  });
}
