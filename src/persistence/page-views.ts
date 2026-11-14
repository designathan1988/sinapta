// Notion's page analytics: each opening of a page is kept, on the server
// while a server workspace is open (with who opened it), else in this
// browser; the page's views are read when its "Updates & analytics"
// panel opens, and again after an opening while it is open.
import type { BlockId } from "../model/index.ts";
import {
  setPageViews,
  type AppState,
  type AppStore,
  type Dispatch,
  type PageView,
} from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { readPageViews } from "./page-view.schema.ts";
import { getJson } from "./sync-session.ts";

// Opening the same page again within this time is the same view.
const SAME_VIEW_MS = 30 * 60 * 1000;

// A page's views, and whether this person shows their view history;
// null where no one is signed in to say.
export interface ViewsRead {
  readonly views: readonly PageView[];
  readonly showsHistory: boolean | null;
}

export interface PageViewStorage {
  listViews(pageId: BlockId): Promise<ViewsRead>;
  putView(pageId: BlockId, viewedAt: string): Promise<void>;
  setShowsHistory(allowed: boolean): Promise<void>;
}

export function createMemoryPageViews(): PageViewStorage {
  const all: { pageId: BlockId; viewedAt: string }[] = [];
  return {
    listViews: (pageId) =>
      Promise.resolve({
        views: all
          .filter((view) => view.pageId === pageId)
          .map(({ viewedAt }) => ({ viewedAt, viewer: null })),
        showsHistory: null,
      }),
    putView(pageId, viewedAt) {
      all.push({ pageId, viewedAt });
      return Promise.resolve();
    },
    setShowsHistory: () => Promise.resolve(),
  };
}

function serverPageViews(send: Fetch, workspaceId: string): PageViewStorage {
  const path = (pageId: BlockId) =>
    `/api/workspaces/${workspaceId}/pages/${pageId}/views`;
  return {
    async listViews(pageId) {
      try {
        const read = readPageViews(await getJson(send, path(pageId)));
        const views = (read?.views ?? []).map(({ isHidden, ...view }) =>
          isHidden === true ? { ...view, isHidden } : view,
        );
        return { views, showsHistory: read?.showsHistory ?? null };
      } catch {
        return { views: [], showsHistory: null };
      }
    },
    async setShowsHistory(allowed) {
      try {
        const where = `/api/workspaces/${workspaceId}/view-history`;
        await getJson(send, where, { allowed });
      } catch {
        // Offline: the choice is made again the next time.
      }
    },
    async putView(pageId, viewedAt) {
      try {
        await getJson(send, path(pageId), { viewedAt });
      } catch {
        // A view while offline is not counted, as Notion's is not.
      }
    },
  };
}

// The server's views while a server workspace is open, else these.
export function choosePageViews(
  local: PageViewStorage,
  workspaceIdOf: () => string | null,
  send: Fetch = (input, init) => fetch(input, init),
): PageViewStorage {
  const current = (): PageViewStorage => {
    const workspaceId = workspaceIdOf();
    return workspaceId === null ? local : serverPageViews(send, workspaceId);
  };
  return {
    listViews: (pageId) => current().listViews(pageId),
    putView: (pageId, viewedAt) => current().putView(pageId, viewedAt),
    setShowsHistory: (allowed) => current().setShowsHistory(allowed),
  };
}

export interface PageViewOptions {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly storage: PageViewStorage;
  readonly now?: () => string;
}

function readViews(options: PageViewOptions, pageId: BlockId): void {
  void options.storage.listViews(pageId).then(({ views, showsHistory }) => {
    const read = { pageId, views: [...views], showsHistory };
    options.dispatch(setPageViews.create(read));
  });
}

// The page just opened, unless it was opened a moment ago or is a
// published page read by someone outside.
function openedPage(before: AppState, after: AppState): BlockId | null {
  const pageId = after.ui.activePageId;
  if (pageId === null || pageId === before.ui.activePageId) return null;
  return after.persistence.isPublic ? null : pageId;
}

// Keeps the view, then reads the page's views again if its panel is open.
function recordView(
  options: PageViewOptions,
  lastViewed: Map<BlockId, number>,
  pageId: BlockId,
): void {
  const viewedAt = options.now?.() ?? new Date().toISOString();
  const time = Date.parse(viewedAt);
  const last = lastViewed.get(pageId);
  if (last !== undefined && time - last < SAME_VIEW_MS) return;
  lastViewed.set(pageId, time);
  void options.storage.putView(pageId, viewedAt).then(() => {
    if (options.store.getState().ui.pageUpdates?.pageId === pageId)
      readViews(options, pageId);
  });
}

// Sends "Show your view history" as just chosen, then reads the views.
function sendChoice(
  options: PageViewOptions,
  pageId: BlockId,
  choice: boolean | undefined,
): void {
  if (choice === undefined) return;
  void options.storage.setShowsHistory(choice).then(() => {
    readViews(options, pageId);
  });
}

export function startPageViews(options: PageViewOptions): void {
  const lastViewed = new Map<BlockId, number>();
  let before = options.store.getState();
  let beforeChoice: boolean | undefined;
  options.store.subscribe(() => {
    const after = options.store.getState();
    const opened = openedPage(before, after);
    const panel = after.ui.pageUpdates?.pageId;
    const isNewPanel = panel !== before.ui.pageUpdates?.pageId;
    before = after;
    if (opened !== null) recordView(options, lastViewed, opened);
    if (panel !== undefined && isNewPanel) readViews(options, panel);
    const choice = after.ui.pageUpdates?.historyChoice;
    if (panel !== undefined && !isNewPanel && choice !== beforeChoice)
      sendChoice(options, panel, choice);
    beforeChoice = choice;
  });
}
