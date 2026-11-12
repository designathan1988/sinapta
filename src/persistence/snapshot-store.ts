// Page versions, as Notion's page history: copies of an open page's own
// content as it was before a run of edits, kept at most every 10 minutes
// while it is edited, the 50 newest of each page. The app says what a
// page's own content is.
import {
  parseBlockId,
  type Block,
  type BlockId,
  type Workspace,
} from "../model/index.ts";
import {
  PAGE_HISTORY_OVERLAY,
  setPageVersions,
  type AppState,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";

const SNAPSHOT_EVERY_MS = 10 * 60 * 1000;
const SNAPSHOTS_PER_PAGE = 50;

export interface StoredSnapshot {
  readonly id: string;
  readonly pageId: BlockId;
  readonly takenAt: string;
  readonly blocks: readonly Block[];
}

export interface SnapshotStorage {
  listSnapshots(pageId: BlockId): Promise<StoredSnapshot[]>;
  putSnapshot(snapshot: StoredSnapshot): Promise<void>;
  deleteSnapshots(ids: readonly string[]): Promise<void>;
}

export function createMemorySnapshots(): SnapshotStorage {
  const all = new Map<string, StoredSnapshot>();
  return {
    listSnapshots: (pageId) =>
      Promise.resolve(
        [...all.values()].filter((item) => item.pageId === pageId),
      ),
    putSnapshot(snapshot) {
      all.set(snapshot.id, snapshot);
      return Promise.resolve();
    },
    deleteSnapshots(ids) {
      for (const id of ids) all.delete(id);
      return Promise.resolve();
    },
  };
}

// The oldest snapshots past the cap, to delete.
export function overflowingSnapshots(
  snapshots: readonly StoredSnapshot[],
  cap: number,
): string[] {
  const oldestFirst = [...snapshots].sort((a, b) =>
    a.takenAt.localeCompare(b.takenAt),
  );
  return oldestFirst
    .slice(0, Math.max(0, oldestFirst.length - cap))
    .map((item) => item.id);
}

export interface SnapshotOptions {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly storage: SnapshotStorage;
  readonly now?: () => string;
  readonly contentOf: (
    workspace: Workspace,
    pageId: BlockId,
  ) => readonly Block[];
}

function sameContent(a: readonly Block[], b: readonly Block[]): boolean {
  return a.length === b.length && a.every((block, index) => block === b[index]);
}

// The pages being edited: the open page and the one in a peek.
function editedPages(state: AppState): BlockId[] {
  const { activePageId, peek } = state.ui;
  return [activePageId, peek?.pageId ?? null].flatMap((id) =>
    id === null ? [] : [id],
  );
}

async function keep(storage: SnapshotStorage, snapshot: StoredSnapshot) {
  await storage.putSnapshot(snapshot);
  const kept = await storage.listSnapshots(snapshot.pageId);
  const old = overflowingSnapshots(kept, SNAPSHOTS_PER_PAGE);
  if (old.length > 0) await storage.deleteSnapshots(old);
}

function takeDue(
  options: SnapshotOptions,
  lastTaken: Map<BlockId, number>,
  states: { readonly before: AppState; readonly after: AppState },
): void {
  const { before, after } = states;
  if (before.workspace === after.workspace) return;
  const takenAt = options.now?.() ?? new Date().toISOString();
  const time = Date.parse(takenAt);
  for (const pageId of editedPages(after)) {
    const content = options.contentOf(after.workspace, pageId);
    const earlier = options.contentOf(before.workspace, pageId);
    if (earlier.length === 0 || sameContent(content, earlier)) continue;
    const last = lastTaken.get(pageId);
    if (last !== undefined && time - last < SNAPSHOT_EVERY_MS) continue;
    lastTaken.set(pageId, time);
    const snapshot = {
      id: `${pageId}@${takenAt}`,
      pageId,
      takenAt,
      blocks: earlier,
    };
    void keep(options.storage, snapshot);
  }
}

// When a page's history opens, its versions are read, newest first.
function readWhenAsked(
  options: SnapshotOptions,
  states: { readonly before: AppState; readonly after: AppState },
): void {
  const overlay = states.after.ui.overlay;
  if (overlay?.kind !== PAGE_HISTORY_OVERLAY || overlay.anchorId === undefined)
    return;
  if (states.before.ui.overlay?.kind === PAGE_HISTORY_OVERLAY) return;
  const pageId = parseBlockId(overlay.anchorId);
  if (pageId === undefined) return;
  void options.storage.listSnapshots(pageId).then((list) => {
    const versions = [...list]
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
      .map(({ id, takenAt, blocks }) => ({ id, takenAt, blocks }));
    options.dispatch(setPageVersions.create({ pageId, versions }));
  });
}

export function startSnapshots(options: SnapshotOptions): void {
  const lastTaken = new Map<BlockId, number>();
  let before = options.store.getState();
  options.store.subscribe(() => {
    const after = options.store.getState();
    const states = { before, after };
    before = after;
    takeDue(options, lastTaken, states);
    readWhenAsked(options, states);
  });
}
