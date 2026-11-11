// Commands inside the open overlay: which panel of it is shown, the
// option list opened from it, and what is typed into its search field.
// The ui slice still holds one overlay; its list is a part of it.
import type { OpenOverlay, UiState } from "./app-state.ts";
import { defineCommand, type NoPayload } from "./command-registry.ts";

function withOverlay(
  ui: UiState,
  change: (overlay: OpenOverlay) => OpenOverlay,
): { ui: UiState } | Record<string, never> {
  if (ui.overlay === null) return {};
  return { ui: { ...ui, overlay: change(ui.overlay) } };
}

// The overlay as it was opened: its first panel, no list, no search.
function bare(overlay: OpenOverlay): OpenOverlay {
  const { panel: _panel, child: _child, query: _query, ...rest } = overlay;
  return rest;
}

// Moves to a panel of the overlay; null goes back to its first panel.
export const openOverlayPanel = defineCommand<{ panel: string | null }>({
  type: "ui.openOverlayPanel",
  handle: (state, command) =>
    withOverlay(state.ui, (overlay) => ({
      ...bare(overlay),
      ...(command.panel !== null && { panel: command.panel }),
    })),
});

export const openChildOverlay = defineCommand<{ anchorId: string }>({
  type: "ui.openChildOverlay",
  handle: (state, command) =>
    withOverlay(state.ui, (overlay) => ({
      ...overlay,
      child: { anchorId: command.anchorId },
    })),
});

export const closeChildOverlay = defineCommand<NoPayload>({
  type: "ui.closeChildOverlay",
  handle(state) {
    if (state.ui.overlay?.child === undefined) return {};
    return withOverlay(state.ui, ({ child: _child, ...rest }) => rest);
  },
});

// Searches the open list, or the overlay itself when no list is open.
export const setOverlayQuery = defineCommand<{ query: string }>({
  type: "ui.setOverlayQuery",
  handle: (state, command) =>
    withOverlay(state.ui, (overlay) =>
      overlay.child === undefined
        ? { ...overlay, query: command.query }
        : { ...overlay, child: { ...overlay.child, query: command.query } },
    ),
});

export const uiOverlayCommands = [
  openOverlayPanel,
  openChildOverlay,
  closeChildOverlay,
  setOverlayQuery,
];
