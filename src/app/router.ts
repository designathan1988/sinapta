// Keeps the URL and the open place in step. The store is the truth; the
// URL is a projection of `ui.activePageId` and `ui.isHomeOpen`, and a way
// to change them.
import { parseBlockId, type BlockId } from "../model/index.ts";
import {
  openHome,
  setActivePage,
  type AppStore,
  type Dispatch,
  type UiState,
} from "../state/index.ts";

const PAGE_PREFIX = "#/page/";
const HOME_HASH = "#/home";

export function pageIdFromHash(hash: string): BlockId | null {
  if (!hash.startsWith(PAGE_PREFIX)) return null;
  return parseBlockId(hash.slice(PAGE_PREFIX.length)) ?? null;
}

export function isHomeHash(hash: string): boolean {
  return hash === HOME_HASH;
}

export function hashForPage(pageId: BlockId | null): string {
  return pageId === null ? "" : `${PAGE_PREFIX}${pageId}`;
}

export function hashForUi(ui: UiState): string {
  const isHome = ui.isHomeOpen && ui.activePageId === null;
  return isHome ? HOME_HASH : hashForPage(ui.activePageId);
}

export function startRouter(store: AppStore, dispatch: Dispatch): void {
  const openFromUrl = (): void => {
    if (isHomeHash(location.hash)) {
      dispatch(openHome.create({}));
      return;
    }
    const pageId = pageIdFromHash(location.hash);
    if (pageId !== null) dispatch(setActivePage.create({ pageId }));
  };
  // Back and forward change the hash; follow it.
  window.addEventListener("hashchange", openFromUrl);
  openFromUrl();
  const writeUrl = (): void => {
    const hash = hashForUi(store.getState().ui);
    if (hash === location.hash) return;
    history.pushState(null, "", hash === "" ? location.pathname : hash);
  };
  store.subscribe(writeUrl);
  writeUrl();
}
