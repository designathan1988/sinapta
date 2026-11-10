// Commands for the parts of the `ui` slice that belong to no feature.
import { SIDEBAR_WIDTH, type OpenOverlay } from "./app-state.ts";
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

export const uiCommands = [
  setSidebarWidth,
  toggleSidebar,
  openOverlay,
  closeOverlay,
];
