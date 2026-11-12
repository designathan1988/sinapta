// Keeps the URL and the open place in step. The store is the truth; the
// URL is a projection of `ui.activePageId` and `ui.isHomeOpen`, and a way
// to change them. A link to a block also shows that block.
import type { BlockId } from "../model/index.ts";
import {
  openHome,
  setActivePage,
  setSelection,
  type AppState,
  type AppStore,
  type Dispatch,
  type UiState,
} from "../state/index.ts";
import { openPeek } from "../features/row-peek/index.ts";
import {
  hashForPage,
  hashForPeek,
  parsePageHash,
} from "../ui/address/index.ts";
import { afterRender } from "../ui/focus/index.ts";

const HOME_HASH = "#/home";

export { hashForPage };

export function pageIdFromHash(hash: string): BlockId | null {
  return parsePageHash(hash)?.pageId ?? null;
}

export function isHomeHash(hash: string): boolean {
  return hash === HOME_HASH;
}

export function hashForUi(ui: UiState): string {
  const { activePageId, peek } = ui;
  if (ui.isHomeOpen && activePageId === null) return HOME_HASH;
  return activePageId !== null && peek !== null
    ? hashForPeek(activePageId, peek)
    : hashForPage(activePageId);
}

// Opens what a URL names. A link to a block also puts the caret at the
// start of the block; the block is returned so that it can be shown.
export function openFromHash(
  hash: string,
  state: AppState,
  dispatch: Dispatch,
): BlockId | undefined {
  if (isHomeHash(hash)) {
    dispatch(openHome.create({}));
    return undefined;
  }
  const address = parsePageHash(hash);
  if (address === null) return undefined;
  dispatch(setActivePage.create({ pageId: address.pageId }));
  const { blockId, peek } = address;
  if (peek !== undefined && peek.pageId in state.workspace.blocks) {
    dispatch(openPeek.create({ peek }));
  }
  if (blockId === undefined || !(blockId in state.workspace.blocks)) {
    return undefined;
  }
  const selection = { blockId, anchorOffset: 0, focusOffset: 0 };
  dispatch(setSelection.create({ selection }));
  return blockId;
}

// Scrolls the linked block into view and flashes it once.
function revealBlock(blockId: BlockId): void {
  afterRender(() => {
    const selector = `[data-block-id="${CSS.escape(blockId)}"]`;
    const block = document.querySelector<HTMLElement>(selector);
    if (block === null) return;
    block.scrollIntoView({ block: "center" });
    block.setAttribute("data-flash", "");
    block.addEventListener(
      "animationend",
      () => {
        block.removeAttribute("data-flash");
      },
      { once: true },
    );
  });
}

// The row a URL has open in a peek, or null.
function peekIdFromHash(hash: string): BlockId | null {
  return parsePageHash(hash)?.peek?.pageId ?? null;
}

// Moving within one page, as when a link to a block becomes the page's
// own address, replaces the history entry rather than adding one; a peek
// that opens or closes adds one, so that Back closes it.
function writeUrl(store: AppStore): void {
  const hash = hashForUi(store.getState().ui);
  if (hash === location.hash) return;
  const url = hash === "" ? location.pathname : hash;
  const pageId = pageIdFromHash(hash);
  const isSamePeek = peekIdFromHash(hash) === peekIdFromHash(location.hash);
  if (
    pageId !== null &&
    pageId === pageIdFromHash(location.hash) &&
    isSamePeek
  ) {
    history.replaceState(null, "", url);
  } else {
    history.pushState(null, "", url);
  }
}

export function startRouter(store: AppStore, dispatch: Dispatch): void {
  const openFromUrl = (): void => {
    const blockId = openFromHash(location.hash, store.getState(), dispatch);
    if (blockId !== undefined) revealBlock(blockId);
  };
  // Back and forward change the hash; follow it.
  window.addEventListener("hashchange", openFromUrl);
  openFromUrl();
  store.subscribe(() => {
    writeUrl(store);
  });
  writeUrl(store);
}
