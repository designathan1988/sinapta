import "./page-menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  createPage,
  selectPage,
  DATABASE_TYPE,
  PAGE_TYPE,
  setPageLocked,
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
import {
  backlinksItem,
  renderFontTiles,
  styleItems,
} from "./page-menu-style.view.ts";
import {
  pageIdOfAnchor,
  pageMenuAnchorId,
  placeOfAnchor,
  TREE_PLACE,
} from "./page-menu-anchor.ts";
import { renameItem } from "./page-rename.view.ts";
import {
  exportItems,
  historyItem,
  pageActionItems,
  resolvedItems,
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
    aria-expanded=${String(isOpen)}
    aria-label=${COPY.pageMenu.open}
    title=${tooltipTitle(COPY.pageMenu.open)}
    interestfor=${TOOLTIP_TARGET}
    @click=${onClick}
  >
    ${renderIcon("more")}
  </button>`;
}

// Notion's lock switch: a page's text and blocks, or a database's
// properties and views, stay as they are while it is on.
function lockItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const isLocked = page.props.isLocked === true;
  const pageId = page.id;
  return {
    label:
      page.type === DATABASE_TYPE
        ? COPY.pageMenu.lockDatabase
        : COPY.pageMenu.lockPage,
    icon: "lock",
    check: "switch",
    isChecked: isLocked,
    onSelect: () =>
      dispatch(setPageLocked.create({ pageId, isLocked: !isLocked })),
  };
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

// The page's place: a favorite or not, and a page inside it.
function placeItems(page: PageBlock, dispatch: Dispatch): MenuItem[] {
  const pageId = page.id;
  return [
    favoriteItem(page, dispatch),
    {
      label: COPY.pageMenu.addSubpage,
      icon: "plus",
      onSelect: () => dispatch(createPage.create({ parentId: pageId })),
    },
  ];
}

const DIVIDER: MenuEntry = { kind: "divider" };

// Groups with a line between each, leaving out the empty ones.
function grouped(groups: readonly (readonly MenuItem[])[]): MenuEntry[] {
  return groups
    .filter((group) => group.length > 0)
    .flatMap((group, index): MenuEntry[] =>
      index === 0 ? [...group] : [DIVIDER, ...group],
    );
}

// Notion's groups: act on the page; its style; its lock and place; its
// past; its files. Moving up and down is the sidebar's Alt with arrows.
function menuEntries(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuEntry[] {
  const pageId = page.id;
  const isPage = page.type === PAGE_TYPE;
  return grouped([
    pageActionItems(state, pageId, dispatch),
    styleItems(page, dispatch),
    [
      lockItem(page, dispatch),
      ...(isPage ? [backlinksItem(page, dispatch)] : []),
      ...placeItems(page, dispatch),
    ],
    [historyItem(pageId, dispatch), ...resolvedItems(state, pageId, dispatch)],
    exportItems(state, pageId),
  ]);
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
// page's last edit, as Notion's; elsewhere every group, the style tiles
// and the word count.
function menuParts(state: AppState, page: PageBlock, dispatch: Dispatch) {
  const anchorId = state.ui.overlay?.anchorId;
  if (placeOfAnchor(anchorId) === TREE_PLACE) {
    return {
      items: treeEntries(state, page, dispatch),
      footer: selectEditedLabel(state, page.id, new Date().toISOString()),
    };
  }
  const tiles = renderFontTiles(page, dispatch);
  return {
    items: menuEntries(state, page, dispatch),
    footer: wordCountLabel(state, page.id),
    ...(tiles === nothing ? {} : { lead: tiles }),
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
    search: {
      placeholder: COPY.menu.searchActions,
      query: overlay.query ?? "",
      onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
    },
    ...(overlay.point && { point: overlay.point }),
  });
}
