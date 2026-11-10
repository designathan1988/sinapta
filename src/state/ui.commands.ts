// Commands for the parts of the `ui` slice that belong to no feature.
import type { BlockId } from "../model/index.ts";
import {
  SIDEBAR_WIDTH,
  type OpenOverlay,
  type TextSelection,
} from "./app-state.ts";
import { defineCommand, type NoPayload } from "./command-registry.ts";

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

export const toggleSidebar = defineCommand<NoPayload>({
  type: "ui.toggleSidebar",
  handle: (state) => ({
    ui: { ...state.ui, isSidebarCollapsed: !state.ui.isSidebarCollapsed },
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
    if (pageId === state.ui.activePageId) return {};
    if (pageId !== null && state.workspace.blocks[pageId] === undefined) {
      return {};
    }
    return { ui: { ...state.ui, activePageId: pageId } };
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

export const uiCommands = [
  setSelection,
  setSidebarWidth,
  toggleSidebar,
  openOverlay,
  closeOverlay,
  setActivePage,
  togglePageExpanded,
];
