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
  setSaveStatus,
  toPersistedUi,
  type AppState,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";
import { runMigrations } from "./migrations/run-migrations.ts";
import type { StorageAdapter, StorageChanges } from "./storage-adapter.ts";

export const SAVE_DEBOUNCE_MS = 300;

export interface RepositoryOptions {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly adapter: StorageAdapter;
  readonly propsSchemas: PropsSchemas;
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

async function load(options: RepositoryOptions): Promise<void> {
  const stored = await options.adapter.load();
  if (stored === null) return;
  const migrated = runMigrations(stored.file);
  if (!migrated.ok) return;
  const parsed = parseWorkspaceFile(migrated.file, options.propsSchemas);
  if (!parsed.ok) return;
  options.dispatch(
    loadWorkspace.create({
      workspace: parsed.workspace,
      ui: restoreUi(stored.ui),
      skippedCount: parsed.skipped.length,
    }),
  );
}

function watch(options: RepositoryOptions): void {
  const { store, dispatch, adapter } = options;
  let pending = createPending();
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function flush(): Promise<void> {
    const saving = pending;
    pending = createPending();
    dispatch(setSaveStatus.create({ status: "saving" }));
    try {
      await adapter.save(toStorageChanges(saving, store.getState()));
      dispatch(setSaveStatus.create({ status: "saved" }));
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

// Loads stored data into the store, then starts saving changes. Changes
// made by the load itself are not written back.
export async function startRepository(
  options: RepositoryOptions,
): Promise<void> {
  try {
    await load(options);
  } catch {
    options.dispatch(setSaveStatus.create({ status: "failed" }));
  }
  watch(options);
}
