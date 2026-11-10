import { html, nothing, type TemplateResult } from "lit-html";
import {
  createPage,
  movePage,
  selectPage,
  selectPagePosition,
  togglePageFavorite,
  trashPage,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";

export const PAGE_MENU_OVERLAY = "page-menu";
// Opened from this menu; rendered by the move-to feature.
export const MOVE_TO_OVERLAY_KIND = "move-to";

// The same page can show its menu button in several places, so an anchor
// id names the place as well as the page.
export function pageMenuAnchorId(place: string, pageId: BlockId): string {
  return `${place}:${pageId}`;
}

function pageIdOfAnchor(anchorId: string | undefined): BlockId | undefined {
  return parseBlockId(anchorId?.split(":")[1] ?? "");
}

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
    tabindex=${options.isTabStop === false ? "-1" : "0"}
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${COPY.pageMenu.open}
    title=${COPY.pageMenu.open}
    @click=${onClick}
  >
    ${renderIcon("more")}
  </button>`;
}

function moveItems(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuItem[] {
  const { id: pageId, parentId } = page;
  const { index, count } = selectPagePosition(state, page);
  const move = (offset: number) => () =>
    dispatch(movePage.create({ pageId, parentId, index: index + offset }));
  return [
    {
      label: COPY.pageMenu.moveUp,
      icon: "up",
      onSelect: move(-1),
      isDisabled: index <= 0,
    },
    {
      label: COPY.pageMenu.moveDown,
      icon: "down",
      onSelect: move(1),
      isDisabled: index >= count - 1,
    },
    {
      label: COPY.moveTo.action,
      icon: "chevron",
      onSelect: () =>
        dispatch(
          openOverlay.create({
            overlay: { kind: MOVE_TO_OVERLAY_KIND, anchorId: pageId },
          }),
        ),
    },
  ];
}

function menuItems(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuItem[] {
  const pageId = page.id;
  return [
    {
      label: page.props.isFavorite
        ? COPY.pageMenu.removeFavorite
        : COPY.pageMenu.addFavorite,
      icon: "star",
      onSelect: () => dispatch(togglePageFavorite.create({ pageId })),
    },
    {
      label: COPY.pageMenu.addSubpage,
      icon: "plus",
      onSelect: () => dispatch(createPage.create({ parentId: pageId })),
    },
    ...moveItems(state, page, dispatch),
    {
      label: COPY.pageMenu.trash,
      icon: "trash",
      isDanger: true,
      onSelect: () => dispatch(trashPage.create({ pageId })),
    },
  ];
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
    items: menuItems(state, page, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
