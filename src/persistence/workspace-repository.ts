// The only module that reads or writes storage. It loads the workspace at
// startup and then saves what each transaction changed.
import {
  diffWorkspace,
  parseWorkspaceFile,
  SCHEMA_VERSION,
  type BlockId,
  type ChangedRecords,
  type PropsSchemas,
  type ViewId,
} from "../model/index.ts";
import {
  loadWorkspace,
  restoreUi,
  setReadOnly,
  setSaveStatus,
  toPersistedUi,
  type AppState,
  type AppStore,
  type Dispatch,
  type UiState,
} from "../state/index.ts";
import { runMigrations } from "./migrations/run-migrations.ts";
import type { StorageAdapter, StorageChanges } from "./storage-adapter.ts";
import { SOLE_TAB, type TabCoordination } from "./tab-lock.ts";

export const SAVE_DEBOUNCE_MS = 300;

export interface RepositoryOptions {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly adapter: StorageAdapter;
  readonly propsSchemas: PropsSchemas;
  // How this tab shares storage with other tabs; a tab alone by default.
  readonly tabs?: TabCoordination;
}

// Everything changed since the last successful save.
interface Pending {
  blockIds: Set<BlockId>;
  viewIds: Set<ViewId>;
  hasMetaChange: boolean;
  hasUiChange: boolean;
}

function createPending(): Pending {
  return {
    blockIds: new Set(),
    viewIds: new Set(),
    hasMetaChange: false,
    hasUiChange: false,
  };
}

function isEmpty(pending: Pending): boolean {
  const { blockIds, viewIds, hasMetaChange, hasUiChange } = pending;
  return blockIds.size + viewIds.size === 0 && !hasMetaChange && !hasUiChange;
}

function addChanges(pending: Pending, changed: ChangedRecords): void {
  for (const id of changed.blockIds) pending.blockIds.add(id);
  for (const id of changed.viewIds) pending.viewIds.add(id);
  pending.hasMetaChange ||= changed.hasMetaChange;
}

// Reads the records to write from the current state, so several changes to
// one record inside the debounce window become one write.
function toStorageChanges(pending: Pending, state: AppState): StorageChanges {
  const { blocks, views, rootIds, settings } = state.workspace;
  const blockIds = [...pending.blockIds];
  const viewIds = [...pending.viewIds];
  return {
    putBlocks: blockIds.flatMap((id) => blocks[id] ?? []),
    deleteBlockIds: blockIds.filter((id) => blocks[id] === undefined),
    putViews: viewIds.flatMap((id) => views[id] ?? []),
    deleteViewIds: viewIds.filter((id) => views[id] === undefined),
    ...(pending.hasMetaChange && {
      meta: { schemaVersion: SCHEMA_VERSION, rootIds, settings },
    }),
    ...(pending.hasUiChange && { ui: toPersistedUi(state.ui) }),
  };
}

type LoadResult = "loaded" | "empty" | "unreadable";

// "unreadable" when stored data exists but cannot be used. A reload keeps
// the interface state the tab already has.
async function load(
  options: RepositoryOptions,
  ui?: UiState,
): Promise<LoadResult> {
  const stored = await options.adapter.load();
  if (stored === null) return "empty";
  const migrated = runMigrations(stored.file);
  if (!migrated.ok) return "unreadable";
  const parsed = parseWorkspaceFile(migrated.file, options.propsSchemas);
  if (!parsed.ok) return "unreadable";
  // A tree the dispatcher refuses, such as a child its parent does not
  // list, is as unusable as a file that does not parse.
  const result = options.dispatch(
    loadWorkspace.create({
      workspace: parsed.workspace,
      ui: ui ?? restoreUi(stored.ui),
      skippedCount: parsed.skipped.length,
    }),
  );
  return result.ok ? "loaded" : "unreadable";
}

// Asks the browser not to evict the workspace under storage pressure. It
// may refuse; the data is then kept as long as the browser allows.
function requestPersistentStorage(): void {
  if (typeof navigator === "undefined" || !("storage" in navigator)) return;
  navigator.storage.persist().catch(() => false);
}

function watch(options: RepositoryOptions, tabs: TabCoordination): void {
  const { store, dispatch, adapter } = options;
  let pending = createPending();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hasSaved = false;

  async function flush(): Promise<void> {
    const saving = pending;
    pending = createPending();
    dispatch(setSaveStatus.create({ status: "saving" }));
    try {
      await adapter.save(toStorageChanges(saving, store.getState()));
      dispatch(setSaveStatus.create({ status: "saved" }));
      tabs.announceSave();
      if (!hasSaved) requestPersistentStorage();
      hasSaved = true;
    } catch {
      // Keep what was not written so that the next save retries it.
      addChanges(pending, saving);
      pending.hasUiChange ||= saving.hasUiChange;
      dispatch(setSaveStatus.create({ status: "failed" }));
    }
  }

  store.subscribe((state, previous) => {
    addChanges(pending, diffWorkspace(previous.workspace, state.workspace));
    pending.hasUiChange ||=
      toPersistedUiKey(state) !== toPersistedUiKey(previous);
    if (isEmpty(pending)) return;
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
  });
}

function toPersistedUiKey(state: AppState): string {
  return JSON.stringify(toPersistedUi(state.ui));
}

// Loads stored data into the store, then starts saving changes, and says
// whether storage was empty. Changes
// made by the load itself are not written back. When stored data cannot be
// read, nothing is saved in this session, so that the data is not
// overwritten by an empty workspace.
export interface RepositoryStart {
  // Nothing was stored before: the caller may give the person a start.
  readonly isFirstRun: boolean;
}

async function reload(options: RepositoryOptions): Promise<void> {
  await load(options, options.store.getState().ui).catch(() => "unreadable");
}

// A reader tab shows what the writer tab saved and takes over writing once
// that tab closes, starting from what it last saved.
function followWriter(options: RepositoryOptions, tabs: TabCoordination): void {
  const { dispatch } = options;
  dispatch(setReadOnly.create({ isReadOnly: true }));
  tabs.onSaved(() => void reload(options));
  void tabs.waitForWriter().then(async () => {
    await reload(options);
    dispatch(setReadOnly.create({ isReadOnly: false }));
    watch(options, tabs);
  });
}

export async function startRepository(
  options: RepositoryOptions,
): Promise<RepositoryStart> {
  const tabs = options.tabs ?? SOLE_TAB;
  const role = await tabs.claim();
  const result = await load(options).catch(() => "unreadable" as const);
  if (result === "unreadable") {
    options.dispatch(setSaveStatus.create({ status: "failed" }));
    return { isFirstRun: false };
  }
  if (role === "reader") {
    followWriter(options, tabs);
    return { isFirstRun: false };
  }
  watch(options, tabs);
  return { isFirstRun: result === "empty" };
}
