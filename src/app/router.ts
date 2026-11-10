// Keeps the URL and the active page in step. The store is the truth; the
// URL is a projection of `ui.activePageId` and a way to change it.
import { parseBlockId, type BlockId } from "../model/index.ts";
import { setActivePage, type AppStore, type Dispatch } from "../state/index.ts";

const PAGE_PREFIX = "#/page/";

export function pageIdFromHash(hash: string): BlockId | null {
  if (!hash.startsWith(PAGE_PREFIX)) return null;
  return parseBlockId(hash.slice(PAGE_PREFIX.length)) ?? null;
}

export function hashForPage(pageId: BlockId | null): string {
  return pageId === null ? "" : `${PAGE_PREFIX}${pageId}`;
}

export function startRouter(store: AppStore, dispatch: Dispatch): void {
  const openFromUrl = (): void => {
    const pageId = pageIdFromHash(location.hash);
    if (pageId !== null) dispatch(setActivePage.create({ pageId }));
  };
  // Back and forward change the hash; follow it.
  window.addEventListener("hashchange", openFromUrl);
  openFromUrl();
  const writeUrl = (): void => {
    const hash = hashForPage(store.getState().ui.activePageId);
    if (hash === location.hash) return;
    history.pushState(null, "", hash === "" ? location.pathname : hash);
  };
  store.subscribe(writeUrl);
  writeUrl();
}
