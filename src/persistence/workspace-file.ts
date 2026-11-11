// Export and import of the whole workspace as one JSON file. The file has
// the same shape as stored data and is a public contract: its keys and
// value formats change only with a schemaVersion bump and a migration.
import {
  parseJsonText,
  parseWorkspaceFile,
  SCHEMA_VERSION,
  type PropsSchemas,
  type RecordError,
  type Workspace,
  type WorkspaceFileError,
} from "../model/index.ts";
import {
  finishImport,
  importWorkspace,
  type AppStore,
  type Dispatch,
  type ImportError,
} from "../state/index.ts";
import { runMigrations } from "./migrations/run-migrations.ts";

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
export function serializeWorkspace(workspace: Workspace): string {
  const { rootIds, settings } = workspace;
  const file = {
    schemaVersion: SCHEMA_VERSION,
    rootIds,
    blocks: sortedById(workspace.blocks),
    views: sortedById(workspace.views),
    settings,
  };
  return JSON.stringify(file, null, 2);
}

export type ImportResult =
  | {
      readonly ok: true;
      readonly workspace: Workspace;
      readonly skipped: readonly RecordError[];
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
  return { ok: true, workspace: parsed.workspace, skipped: parsed.skipped };
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
  // Replaced in tests, where there is no document to download into.
  readonly save?: (text: string) => void;
}

// Watches the store for export and import requests and carries them out.
// The requests are plain state; the file work happens here, after the
// store has finished notifying.
export function startFileTools(options: FileToolsOptions): void {
  const { store, dispatch, propsSchemas } = options;
  const save = options.save ?? download;
  store.subscribe((state, previous) => {
    const { exportRequests, pendingImport } = state.persistence;
    if (exportRequests !== previous.persistence.exportRequests) {
      save(serializeWorkspace(state.workspace));
    }
    if (
      pendingImport === null ||
      pendingImport === previous.persistence.pendingImport
    ) {
      return;
    }
    queueMicrotask(() => {
      const result = readWorkspaceFile(pendingImport, propsSchemas);
      if (!result.ok) {
        dispatch(finishImport.create({ error: result.error }));
        return;
      }
      const { workspace, skipped } = result;
      const imported = dispatch(
        importWorkspace.create({ workspace, skippedCount: skipped.length }),
      );
      // A tree the dispatcher refuses is not a workspace this app can use.
      if (!imported.ok) {
        dispatch(finishImport.create({ error: "not-a-workspace" }));
      }
    });
  });
}
