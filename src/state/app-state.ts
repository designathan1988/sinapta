// The shape of the single application state and its initial value.
import {
  createEmptyWorkspace,
  type BlockId,
  type Operation,
  type Workspace,
} from "../model/index.ts";

export interface TextSelection {
  readonly blockId: BlockId;
  // UTF-16 offsets that always sit on grapheme cluster boundaries.
  readonly anchorOffset: number;
  readonly focusOffset: number;
}

export interface OpenOverlay {
  // Which overlay is open; each feature names its own kinds.
  readonly kind: string;
  // The element the overlay is anchored to, if any.
  readonly anchorId?: string;
}

export interface UiState {
  readonly activePageId: BlockId | null;
  // Pages whose children are shown in the sidebar tree.
  readonly expandedPageIds: readonly BlockId[];
  readonly selection: TextSelection | null;
  // Sidebar width in rem.
  readonly sidebarWidth: number;
  readonly isSidebarCollapsed: boolean;
  readonly overlay: OpenOverlay | null;
}

export interface HistoryEntry {
  // Operations that reverse the transaction this entry records.
  readonly operations: readonly Operation[];
  readonly selection: TextSelection | null;
  readonly activePageId: BlockId | null;
}

export interface HistoryState {
  readonly undo: readonly HistoryEntry[];
  readonly redo: readonly HistoryEntry[];
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export interface PersistenceState {
  readonly status: SaveStatus;
  // Stored records that failed their schema on load and were skipped.
  readonly skippedCount: number;
}

export interface AppState {
  readonly workspace: Workspace;
  readonly ui: UiState;
  readonly history: HistoryState;
  readonly persistence: PersistenceState;
}

export const SIDEBAR_WIDTH = {
  min: 12,
  initial: 16,
  max: 30,
  step: 1,
} as const;

export function createInitialUiState(): UiState {
  return {
    activePageId: null,
    expandedPageIds: [],
    selection: null,
    sidebarWidth: SIDEBAR_WIDTH.initial,
    isSidebarCollapsed: false,
    overlay: null,
  };
}

export function createInitialState(): AppState {
  return {
    workspace: createEmptyWorkspace(),
    ui: createInitialUiState(),
    history: { undo: [], redo: [] },
    persistence: { status: "idle", skippedCount: 0 },
  };
}
