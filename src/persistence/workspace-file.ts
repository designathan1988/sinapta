// Export and import of the whole workspace as one JSON file. The file has
// the same shape as stored data and is a public contract: its keys and
// value formats change only with a schemaVersion bump and a migration.
import {
  parseAssetFiles,
  parseJsonText,
  parseWorkspaceFile,
  SCHEMA_VERSION,
  type AssetFile,
  type PropsSchemas,
  type RecordError,
  type Workspace,
  type WorkspaceFileError,
} from "../model/index.ts";
import {
  addAssetUrls,
  finishImport,
  importWorkspace,
  type AppStore,
  type Dispatch,
  type ImportError,
} from "../state/index.ts";
import { toAssetFiles, toStoredAssets } from "./asset-store.ts";
import { runMigrations } from "./migrations/run-migrations.ts";
import type { StorageAdapter } from "./storage-adapter.ts";

function sortedById<TRecord>(
  records: Readonly<Record<string, TRecord>>,
): Record<string, TRecord> {
  const ids = Object.keys(records).sort();
  return Object.fromEntries(
    ids.flatMap((id) => {
      const record = records[id];
      return record === undefined ? [] : [[id, record]];
    }),
  );
}

// Records are written in id order, so the same workspace always gives the
// same file, however its records came to be in memory.
// A file with assets carries them, in id order, after everything else.
export function serializeWorkspace(
  workspace: Workspace,
  assets: readonly AssetFile[] = [],
): string {
  const { rootIds, settings } = workspace;
  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id));
  const file = {
    schemaVersion: SCHEMA_VERSION,
    rootIds,
    blocks: sortedById(workspace.blocks),
    views: sortedById(workspace.views),
    settings,
    ...(assets.length > 0 && { assets: sortedAssets }),
  };
  return JSON.stringify(file, null, 2);
}

type ReadFile = Extract<ImportResult, { ok: true }>;

export type ImportResult =
  | {
      readonly ok: true;
      readonly workspace: Workspace;
      readonly skipped: readonly RecordError[];
      readonly assets: readonly AssetFile[];
    }
  | { readonly ok: false; readonly error: ImportError };

const ERRORS: Record<WorkspaceFileError["kind"], ImportError> = {
  "invalid-file": "not-a-workspace",
  "missing-version": "not-a-workspace",
  "newer-version": "newer-version",
};

// Reads the text of an exported file: JSON, then the same migrations and
// schemas that stored data goes through.
export function readWorkspaceFile(
  text: string,
  propsSchemas: PropsSchemas,
): ImportResult {
  const decoded = parseJsonText(text);
  if (!decoded.ok) return { ok: false, error: "unreadable" };
  const migrated = runMigrations(decoded.json);
  if (!migrated.ok) return { ok: false, error: ERRORS[migrated.error.kind] };
  const parsed = parseWorkspaceFile(migrated.file, propsSchemas);
  if (!parsed.ok) return { ok: false, error: ERRORS[parsed.error.kind] };
  const assets = parseAssetFiles(migrated.file.assets);
  return {
    ok: true,
    workspace: parsed.workspace,
    skipped: parsed.skipped,
    assets,
  };
}

const FILE_NAME = "pagecraft-workspace.json";

function download(text: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}

export interface FileToolsOptions {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly propsSchemas: PropsSchemas;
  // Where assets are kept; without it files carry no assets.
  readonly adapter?: Pick<StorageAdapter, "loadAssets" | "putAssets">;
  // Replaced in tests, where there is no document to download into.
  readonly save?: (text: string) => void;
}

// The assets the blocks of a workspace hold.
function heldAssetIds(workspace: Workspace): Set<string> {
  return new Set(
    Object.values(workspace.blocks).flatMap((block) => {
      const { assetId } = block.props;
      return typeof assetId === "string" ? [assetId] : [];
    }),
  );
}

// Writes the workspace with the assets its blocks hold.
async function exportFile(
  options: FileToolsOptions,
  workspace: Workspace,
): Promise<void> {
  const save = options.save ?? download;
  const { adapter } = options;
  if (adapter === undefined) {
    save(serializeWorkspace(workspace));
    return;
  }
  const held = heldAssetIds(workspace);
  const stored = (await adapter.loadAssets()).filter((asset) =>
    held.has(asset.id),
  );
  save(serializeWorkspace(workspace, await toAssetFiles(stored)));
}

// A file's assets are kept before its workspace replaces the current one,
// so a full disk leaves the current workspace as it was.
async function keepAssets(
  adapter: Pick<StorageAdapter, "putAssets">,
  assets: readonly AssetFile[],
): Promise<Record<string, string> | undefined> {
  const stored = toStoredAssets(assets);
  try {
    await adapter.putAssets(stored);
  } catch {
    return undefined;
  }
  return Object.fromEntries(
    stored.map((asset) => [asset.id, URL.createObjectURL(asset.blob)]),
  );
}

function replaceWorkspace(options: FileToolsOptions, result: ReadFile): void {
  const { dispatch } = options;
  const { workspace, skipped } = result;
  const imported = dispatch(
    importWorkspace.create({ workspace, skippedCount: skipped.length }),
  );
  // A tree the dispatcher refuses is not a workspace this app can use.
  if (!imported.ok) {
    dispatch(finishImport.create({ error: "not-a-workspace" }));
  }
}

function importFile(options: FileToolsOptions, text: string): void {
  const { dispatch, adapter } = options;
  const result = readWorkspaceFile(text, options.propsSchemas);
  if (!result.ok) {
    dispatch(finishImport.create({ error: result.error }));
    return;
  }
  if (adapter === undefined || result.assets.length === 0) {
    replaceWorkspace(options, result);
    return;
  }
  void keepAssets(adapter, result.assets).then((urls) => {
    if (urls === undefined) {
      dispatch(finishImport.create({ error: "unreadable" }));
      return;
    }
    dispatch(addAssetUrls.create({ urls }));
    replaceWorkspace(options, result);
  });
}

// Watches the store for export and import requests and carries them out.
// The requests are plain state; the file work happens here, after the
// store has finished notifying.
export function startFileTools(options: FileToolsOptions): void {
  options.store.subscribe((state, previous) => {
    const { exportRequests, pendingImport } = state.persistence;
    if (exportRequests !== previous.persistence.exportRequests) {
      void exportFile(options, state.workspace);
    }
    if (
      pendingImport === null ||
      pendingImport === previous.persistence.pendingImport
    ) {
      return;
    }
    queueMicrotask(() => {
      importFile(options, pendingImport);
    });
  });
}
