// The shape of the single application state and its initial value.
import { NO_SEARCH_FILTERS, type SearchFilters } from "./search-filters.ts";
import {
  INITIAL_PERSISTENCE,
  type PersistenceState,
} from "./persistence-state.ts";

export type {
  ImportError,
  PersistenceState,
  SaveStatus,
} from "./persistence-state.ts";
import type { PageVersion } from "./page-versions.commands.ts";
import { PEEK_WIDTH, SIDEBAR_WIDTH } from "./widths.ts";
import {
  createEmptyWorkspace,
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
  // The overlay's own chosen values, by name, such as the pages a search
  // looks in; a name with no values is a filter shown but not yet set.
  readonly values?: Readonly<Record<string, readonly string[]>>;
  // Where a menu opened by a right click shows, in viewport pixels.
  readonly point?: { readonly x: number; readonly y: number };
  // The panel shown of an overlay that moves between panels, such as a
  // view's settings; absent for its first panel.
  readonly panel?: string;
  readonly draft?: unknown; // settings changed before Save
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

export type CommentNoticeLevel = "all" | "replies";

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
  // The first day a calendar shows in week mode; null for this week.
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
  // The kinds of notice this person turned off in Settings › Notifications.
  readonly mutedNotices: readonly NoticeKind[];
  // New notices also shown by the system, as Notion's desktop notifications.
  readonly desktopNotices: boolean;
  // Notices pushed to this browser by the server even while it is closed.
  readonly pushNotices: boolean;
  // Per page, the comments that bring a notice, as Notion's page
  // notification settings: all of them, or replies and mentions only.
  readonly commentNotices: Readonly<Record<string, CommentNoticeLevel>>;
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
  // The search's filters, kept while it is closed, as Notion's.
  readonly searchFilters: SearchFilters;
  // Sidebar and side peek widths in rem.
  readonly sidebarWidth: number;
  readonly peekWidth: number;
  readonly isSidebarCollapsed: boolean;
  // Under 768 px the sidebar is a drawer, open or closed; neither saved.
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
  readonly suggestingPageId?: BlockId; // the page in Suggesting, unsaved
  // Where a map view was zoomed and moved to; the others frame their pins.
  readonly mapCamera?: MapCamera;
}

export const NOTICE_KINDS = ["mention", "edit", "share", "reminder"] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export interface MapCamera {
  readonly viewId: string;
  readonly zoom: number;
  // The world pixel at the map's centre, at that zoom.
  readonly centerX: number;
  readonly centerY: number;
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
    mutedNotices: [],
    desktopNotices: false,
    pushNotices: false,
    commentNotices: {},
    viewSearches: {},
    searchFilters: NO_SEARCH_FILTERS,
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
    persistence: INITIAL_PERSISTENCE,
  };
}
