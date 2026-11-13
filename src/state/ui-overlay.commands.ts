// Commands inside the open overlay: which panel of it is shown, the
// lists and submenus opened from it, and what is typed into a search
// field. The ui slice still holds one overlay; its lists are a part of it.
import type { OpenOverlay, OverlayChild, UiState } from "./app-state.ts";
import { defineCommand } from "./command-registry.ts";

function withOverlay(
  ui: UiState,
  change: (overlay: OpenOverlay) => OpenOverlay,
): { ui: UiState } | Record<string, never> {
  if (ui.overlay === null) return {};
  return { ui: { ...ui, overlay: change(ui.overlay) } };
}

// The overlay as it was opened: its first panel, no list, no search.
function bare(overlay: OpenOverlay): OpenOverlay {
  const {
    panel: _panel,
    children: _children,
    query: _query,
    ...rest
  } = overlay;
  return rest;
}

// The overlay with only its first `depth` lists and submenus open.
function keepChildren(
  overlay: OpenOverlay,
  children: readonly OverlayChild[],
): OpenOverlay {
  const { children: _children, ...rest } = overlay;
  return children.length === 0 ? rest : { ...rest, children };
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

// Opens a list or submenu from a control that sits inside `depth` of the
// open ones (none by default): those stay, any deeper close.
export const openChildOverlay = defineCommand<{
  anchorId: string;
  depth?: number;
}>({
  type: "ui.openChildOverlay",
  handle: (state, command) =>
    withOverlay(state.ui, (overlay) => {
      const outer = (overlay.children ?? []).slice(0, command.depth ?? 0);
      return keepChildren(overlay, [...outer, { anchorId: command.anchorId }]);
    }),
});

// Keeps the first `depth` lists and submenus; by default closes the
// innermost.
export const closeChildOverlay = defineCommand<{ depth?: number }>({
  type: "ui.closeChildOverlay",
  handle(state, command) {
    const children = state.ui.overlay?.children ?? [];
    if (children.length === 0) return {};
    const depth = command.depth ?? children.length - 1;
    return withOverlay(state.ui, (overlay) =>
      keepChildren(overlay, children.slice(0, depth)),
    );
  },
});

// Searches the innermost open list, or the overlay itself when none is.
export const setOverlayQuery = defineCommand<{ query: string }>({
  type: "ui.setOverlayQuery",
  handle: (state, command) =>
    withOverlay(state.ui, (overlay) => {
      const children = overlay.children ?? [];
      const last = children.at(-1);
      if (last === undefined) return { ...overlay, query: command.query };
      const searched = { ...last, query: command.query };
      return { ...overlay, children: [...children.slice(0, -1), searched] };
    }),
});

// Sets the values the open overlay holds under a name, keeping its lists
// open; null takes the name away.
export const setOverlayValues = defineCommand<{
  name: string;
  values: string[] | null;
}>({
  type: "ui.setOverlayValues",
  handle: (state, command) =>
    withOverlay(state.ui, (overlay) => {
      const { [command.name]: _old, ...rest } = overlay.values ?? {};
      const values =
        command.values === null
          ? rest
          : { ...rest, [command.name]: command.values };
      const { values: _values, ...others } = overlay;
      return Object.keys(values).length === 0 ? others : { ...others, values };
    }),
});

export const uiOverlayCommands = [
  openOverlayPanel,
  openChildOverlay,
  closeChildOverlay,
  setOverlayQuery,
  setOverlayValues,
];
