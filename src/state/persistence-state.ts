// The persistence slice: saving to the browser, files, and the account
// on the server (ADR-0013).
import type { AssetError, BlockId } from "../model/index.ts";
import { SIGNED_OUT_LOCAL, type AccountState } from "./account-state.ts";
import { NOT_SYNCED, type SyncState } from "./sync-state.ts";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

// Why an import did not happen.
export type ImportError = "not-a-workspace" | "newer-version" | "unreadable";

export interface PersistenceState {
  readonly status: SaveStatus;
  // Stored records that failed their schema on load and were skipped.
  readonly skippedCount: number;
  // Raised by one each time the user asks for an export; the persistence
  // layer writes the file when it changes.
  readonly exportRequests: number;
  // The text of a file the user chose to import, until it has been read.
  readonly pendingImport: string | null;
  readonly importError: ImportError | null;
  // True while another tab holds the workspace for writing; this tab shows
  // it and follows its saves, but changes nothing.
  readonly isReadOnly: boolean;
  // Why the last file a person added could not be kept, and for which
  // block.
  readonly assetError: {
    readonly blockId: BlockId;
    readonly error: AssetError;
  } | null;
  // The addresses stored assets are shown from, by asset id.
  readonly assetUrls: Readonly<Record<string, string>>;
  // Who is signed in to the server, and the sign-in screen's progress.
  readonly account: AccountState;
  // The workspaces on the server and the one joined.
  readonly sync: SyncState;
}

export const INITIAL_PERSISTENCE: PersistenceState = {
  status: "idle",
  skippedCount: 0,
  exportRequests: 0,
  pendingImport: null,
  importError: null,
  isReadOnly: false,
  assetError: null,
  assetUrls: {},
  account: SIGNED_OUT_LOCAL,
  sync: NOT_SYNCED,
};
