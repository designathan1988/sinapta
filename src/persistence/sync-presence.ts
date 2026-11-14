// Where this person is (ADR-0013): the page open, the block they write in
// and their caret, told to the server so that the others see it.
import type { AppState } from "../state/index.ts";
import { getJson, type Link, type Sync } from "./sync-session.ts";

const PRESENCE_MS = 30_000;
const CARET_MS = 300;

// Tells the server which page this person has open and the block they
// write in, so that the others see their face on it and beside it.
function announce(link: Link, sync: Sync): void {
  const session = link.session;
  if (session?.isReady !== true) return;
  const { activePageId: pageId, selection } = sync.store.getState().ui;
  const blockId = selection?.blockId ?? null;
  const offset = selection?.focusOffset ?? null;
  const path = `/api/workspaces/${session.id}/presence`;
  getJson(sync.send, path, { pageId, blockId, offset }).catch(() => undefined);
}

export function followPage(link: Link, sync: Sync): void {
  const placeOf = (state: AppState) =>
    `${state.ui.activePageId ?? ""}/${state.ui.selection?.blockId ?? ""}`;
  let place = placeOf(sync.store.getState());
  let caret = sync.store.getState().ui.selection?.focusOffset;
  let wasReady = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  sync.store.subscribe((state) => {
    const isReady = link.session?.isReady === true;
    const offset = state.ui.selection?.focusOffset;
    if (placeOf(state) === place && isReady === wasReady) {
      // The caret moved within the block: told a moment later, once.
      if (offset === caret || timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        caret = sync.store.getState().ui.selection?.focusOffset;
        announce(link, sync);
      }, CARET_MS);
      return;
    }
    place = placeOf(state);
    caret = offset;
    wasReady = isReady;
    announce(link, sync);
  });
  setInterval(() => {
    announce(link, sync);
  }, PRESENCE_MS);
}
