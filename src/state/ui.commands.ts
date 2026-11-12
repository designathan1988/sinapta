// Commands for the parts of the `ui` slice that belong to no feature.
import type { BlockId } from "../model/index.ts";
import {
  RECENT_PAGES_MAX,
  type CopiedBlocks,
  SIDEBAR_WIDTH,
  type OpenOverlay,
  type TextSelection,
} from "./app-state.ts";
import { defineCommand, type NoPayload } from "./command-registry.ts";
import { uiOverlayCommands } from "./ui-overlay.commands.ts";
import { setNarrow } from "./viewport.commands.ts";

function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, width));
}

export const setSidebarWidth = defineCommand<{ width: number }>({
  type: "ui.setSidebarWidth",
  handle(state, command) {
    const sidebarWidth = clampSidebarWidth(command.width);
    if (sidebarWidth === state.ui.sidebarWidth) return {};
    return { ui: { ...state.ui, sidebarWidth } };
  },
});

// On a narrow window the button opens and closes the drawer instead.
export const toggleSidebar = defineCommand<NoPayload>({
  type: "ui.toggleSidebar",
  handle: ({ ui }) => ({
    ui: ui.isNarrow
      ? { ...ui, isDrawerOpen: !ui.isDrawerOpen }
      : { ...ui, isSidebarCollapsed: !ui.isSidebarCollapsed },
  }),
});

// Opening an overlay replaces any overlay that is already open.
export const openOverlay = defineCommand<{ overlay: OpenOverlay }>({
  type: "ui.openOverlay",
  handle: (state, command) => ({
    ui: { ...state.ui, overlay: command.overlay },
  }),
});

export const closeOverlay = defineCommand<NoPayload>({
  type: "ui.closeOverlay",
  handle(state) {
    if (state.ui.overlay === null) return {};
    return { ui: { ...state.ui, overlay: null } };
  },
});

// Opens a page, or none. A page that does not exist cannot be opened.
export const setActivePage = defineCommand<{ pageId: BlockId | null }>({
  type: "ui.setActivePage",
  handle(state, command) {
    const { pageId } = command;
    const { ui } = state;
    // Opening the open page again changes nothing, unless Home hides it or
    // it is not yet the latest of the recent pages (as after a reload).
    const isShown = pageId === ui.activePageId && !ui.isHomeOpen;
    if (isShown && (pageId === null || ui.recentPageIds[0] === pageId)) {
      const isClosed = ui.peek === null && !ui.isDrawerOpen;
      return isClosed ? {} : { ui: { ...ui, peek: null, isDrawerOpen: false } };
    }
    if (pageId !== null && state.workspace.blocks[pageId] === undefined) {
      return {};
    }
    const recentPageIds =
      pageId === null
        ? ui.recentPageIds
        : [pageId, ...ui.recentPageIds.filter((id) => id !== pageId)].slice(
            0,
            RECENT_PAGES_MAX,
          );
    // A row open in a peek closes as another page opens.
    return {
      ui: {
        ...ui,
        activePageId: pageId,
        isHomeOpen: false,
        recentPageIds,
        peek: null,
        isDrawerOpen: false,
      },
    };
  },
});

// Shows Home in place of the open page; opening a page leaves it.
export const openHome = defineCommand<NoPayload>({
  type: "ui.openHome",
  handle(state) {
    const { ui } = state;
    if (ui.isHomeOpen && ui.activePageId === null && !ui.isDrawerOpen)
      return {};
    return {
      ui: { ...ui, isHomeOpen: true, activePageId: null, isDrawerOpen: false },
    };
  },
});

export const togglePageExpanded = defineCommand<{ pageId: BlockId }>({
  type: "ui.togglePageExpanded",
  handle(state, command) {
    const { expandedPageIds } = state.ui;
    const isExpanded = expandedPageIds.includes(command.pageId);
    const next = isExpanded
      ? expandedPageIds.filter((id) => id !== command.pageId)
      : [...expandedPageIds, command.pageId];
    return { ui: { ...state.ui, expandedPageIds: next } };
  },
});

function isSameSelection(
  a: TextSelection | null,
  b: TextSelection | null,
): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.blockId === b.blockId &&
    a.anchorOffset === b.anchorOffset &&
    a.focusOffset === b.focusOffset
  );
}

// Records where the caret is once the browser has moved it.
export const setSelection = defineCommand<{ selection: TextSelection | null }>({
  type: "ui.setSelection",
  handle(state, command) {
    if (isSameSelection(state.ui.selection, command.selection)) return {};
    return { ui: { ...state.ui, selection: command.selection } };
  },
});

// Keeps blocks copied with Ctrl+C for the next paste.
export const setClipboard = defineCommand<{ clipboard: CopiedBlocks | null }>({
  type: "ui.setClipboard",
  handle: (state, command) => ({
    ui: { ...state.ui, clipboard: command.clipboard },
  }),
});

export const uiCommands = [
  ...uiOverlayCommands,
  setClipboard,
  setSelection,
  setSidebarWidth,
  toggleSidebar,
  openOverlay,
  closeOverlay,
  setActivePage,
  togglePageExpanded,
  openHome,
  setNarrow,
];
