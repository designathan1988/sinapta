// The shape of the single application state and its initial value.
import type { PageVersion } from "./page-versions.commands.ts";
import { PEEK_WIDTH, SIDEBAR_WIDTH } from "./widths.ts";
import {
  createEmptyWorkspace,
  type AssetError,
  type BlockId,
  type Operation,
  type ClipboardBlock,
  type PropertyId,
  type Tone,
  type ViewId,
  type Workspace,
} from "../model/index.ts";

export interface TextSelection {
  readonly blockId: BlockId;
  // UTF-16 offsets that always sit on grapheme cluster boundaries.
  readonly anchorOffset: number;
  readonly focusOffset: number;
}

// Whole blocks selected together: every block of the page from the anchor
// to the focus, in reading order.
export interface BlockSelection {
  readonly anchorId: BlockId;
  readonly focusId: BlockId;
}

export interface ActiveCell {
  readonly rowId: BlockId;
  // Null for the title column.
  readonly propertyId: PropertyId | null;
  readonly isEditing: boolean;
}

export interface OpenOverlay {
  // Which overlay is open; each feature names its own kinds.
  readonly kind: string;
  // The element the overlay is anchored to, if any.
  readonly anchorId?: string;
  // A range of text the overlay is about, as offsets into a block.
  readonly start?: number;
  readonly end?: number;
  // The highlighted option of a list the keyboard moves through.
  readonly activeIndex?: number;
  // What has been typed into the overlay's search field.
  readonly query?: string;
  // The overlay's own switches that are on, such as a search's "Title
  // only".
  readonly flags?: readonly string[];
  // Where a menu opened by a right click shows, in viewport pixels.
  readonly point?: { readonly x: number; readonly y: number };
  // The panel shown of an overlay that moves between panels, such as a
  // view's settings; absent for its first panel.
  readonly panel?: string;
  // The lists and submenus opened from inside the overlay, outermost
  // first, such as a select in a popover or a column menu's "Edit
  // property": each closes alone with the ones opened from it, and the
  // overlay stays.
  readonly children?: readonly OverlayChild[];
}

export interface OverlayChild {
  // The control the list or submenu belongs to.
  readonly anchorId: string;
  readonly query?: string;
}

export interface UiState {
  readonly activePageId: BlockId | null;
  // True while Home is shown in place of a page.
  readonly isHomeOpen: boolean;
  // Pages opened lately, newest first, at most RECENT_PAGES_MAX.
  readonly recentPageIds: readonly BlockId[];
  // Pages whose children are shown in the sidebar tree.
  readonly expandedPageIds: readonly BlockId[];
  readonly selection: TextSelection | null;
  readonly blockSelection: BlockSelection | null;
  // The view shown for each database that has been opened.
  readonly activeViewIds: Readonly<Record<BlockId, ViewId>>;
  // The table cell that has focus, and whether it is being edited.
  readonly activeCell: ActiveCell | null;
  // The first row of a long table that is scrolled into view.
  readonly tableFirstRow: number;
  // Rows ticked in a table, in the order they were ticked: the last one
  // is where a Shift+click range starts.
  readonly selectedRowIds: readonly BlockId[];
  // The month calendar views show, as "2026-11"; null for the current one.
  readonly calendarMonth: string | null;
  // The first day of the week a calendar shows in week mode; null for
  // the current week.
  readonly calendarWeek: string | null;
  // The row open in a peek beside or over the page, and the view whose
  // order its next and previous rows follow; null while none is.
  readonly peek: {
    readonly pageId: BlockId;
    readonly viewId: ViewId;
    readonly mode: "side" | "center";
  } | null;
  // The reminders read in the inbox, by block and date.
  readonly readReminders: readonly string[];
  // The versions of the page whose history is open, once read.
  readonly pageVersions: {
    readonly pageId: BlockId;
    readonly versions: readonly PageVersion[];
  } | null;
  // The questions a form's last sending left unanswered, by view.
  readonly formErrors: {
    readonly viewId: string;
    readonly propertyIds: readonly string[];
  } | null;
  // What has been typed into each view's search field.
  readonly viewSearches: Readonly<Record<ViewId, string>>;
  // Sidebar and side peek widths in rem.
  readonly sidebarWidth: number;
  readonly peekWidth: number;
  readonly isSidebarCollapsed: boolean;
  // A window under 768 px wide shows the sidebar as a drawer over the
  // page, open or closed on its own; neither is saved.
  readonly isNarrow: boolean;
  readonly isDrawerOpen: boolean;
  // A new version of the app: none, ready to apply, or being applied.
  readonly update: "none" | "ready" | "applying";
  readonly overlay: OpenOverlay | null;
  // The text color or highlight used last, for Ctrl+Shift+H.
  readonly lastTone: LastTone | null;
  // Blocks copied with Ctrl+C, and the text put on the system clipboard
  // for them: a paste of that text rebuilds the blocks.
  readonly clipboard: CopiedBlocks | null;
}

export interface CopiedBlocks {
  readonly text: string;
  readonly blocks: readonly ClipboardBlock[];
}

export interface LastTone {
  readonly key: "color" | "highlight";
  // Null when the last choice removed the color or highlight.
  readonly tone: Tone | null;
}

export interface HistoryEntry {
  // Operations that reverse the transaction this entry records.
  readonly operations: readonly Operation[];
  readonly selection: TextSelection | null;
  readonly activePageId: BlockId | null;
  // Set on entries that later transactions may be merged into.
  readonly mergeKey?: string;
  readonly time?: string;
}

export interface HistoryState {
  readonly undo: readonly HistoryEntry[];
  readonly redo: readonly HistoryEntry[];
}

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
}

export interface AppState {
  readonly workspace: Workspace;
  readonly ui: UiState;
  readonly history: HistoryState;
  readonly persistence: PersistenceState;
}

export const RECENT_PAGES_MAX = 20;

export function createInitialUiState(): UiState {
  return {
    activePageId: null,
    isHomeOpen: false,
    recentPageIds: [],
    expandedPageIds: [],
    selection: null,
    blockSelection: null,
    activeViewIds: {},
    activeCell: null,
    tableFirstRow: 0,
    selectedRowIds: [],
    calendarMonth: null,
    calendarWeek: null,
    formErrors: null,
    peek: null,
    pageVersions: null,
    readReminders: [],
    viewSearches: {},
    sidebarWidth: SIDEBAR_WIDTH.initial,
    peekWidth: PEEK_WIDTH.initial,
    isSidebarCollapsed: false,
    isNarrow: false,
    isDrawerOpen: false,
    update: "none",
    overlay: null,
    lastTone: null,
    clipboard: null,
  };
}

export function createInitialState(): AppState {
  return {
    workspace: createEmptyWorkspace(),
    ui: createInitialUiState(),
    history: { undo: [], redo: [] },
    persistence: {
      status: "idle",
      skippedCount: 0,
      exportRequests: 0,
      pendingImport: null,
      importError: null,
      isReadOnly: false,
      assetError: null,
      assetUrls: {},
    },
  };
}
