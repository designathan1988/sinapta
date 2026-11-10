// The contract between the repository and a storage backend, plus an
// in-memory backend for tests.
import type { Block, BlockId, View, ViewId } from "../model/index.ts";
import type { PersistedUi } from "../state/index.ts";

// Workspace-file-shaped JSON as it was stored. Nothing here is trusted until
// the repository has run it through migrations and the schemas.
export interface StoredData {
  readonly file: unknown;
  readonly ui: unknown;
}

export interface WorkspaceMeta {
  readonly schemaVersion: number;
  readonly rootIds: readonly BlockId[];
  readonly settings: unknown;
}

// One save: only what changed since the last one.
export interface StorageChanges {
  readonly putBlocks: readonly Block[];
  readonly deleteBlockIds: readonly BlockId[];
  readonly putViews: readonly View[];
  readonly deleteViewIds: readonly ViewId[];
  readonly meta?: WorkspaceMeta;
  readonly ui?: PersistedUi;
}

export interface StorageAdapter {
  // Resolves to null when nothing has been saved yet.
  load(): Promise<StoredData | null>;
  // Writes every change or none.
  save(changes: StorageChanges): Promise<void>;
}

export interface MemoryAdapter extends StorageAdapter {
  readonly saves: StorageChanges[];
}

export function createMemoryAdapter(
  stored: StoredData | null = null,
): MemoryAdapter {
  const saves: StorageChanges[] = [];
  return {
    saves,
    load: () => Promise.resolve(stored),
    save(changes) {
      saves.push(changes);
      return Promise.resolve();
    },
  };
}
