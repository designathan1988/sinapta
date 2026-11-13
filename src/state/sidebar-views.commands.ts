// Views kept in the sidebar, as Notion's "Add view to sidebar": each a
// section of its own, for the owner alone, so kept with the settings and
// outside undo.
import type { SidebarView, ViewId } from "../model/index.ts";
import type { AppState } from "./app-state.ts";
import { defineCommand, type CommandEffect } from "./command-registry.ts";

function sidebarViews(state: AppState): readonly SidebarView[] {
  return state.workspace.settings.sidebarViews ?? [];
}

function withViews(views: readonly SidebarView[]): CommandEffect {
  const patch = { sidebarViews: [...views] };
  return { operations: [{ type: "record.update", kind: "settings", patch }] };
}

export const addSidebarView = defineCommand<{ viewId: ViewId }>({
  type: "settings.addSidebarView",
  handle(state, command) {
    const views = sidebarViews(state);
    if (views.some((entry) => entry.viewId === command.viewId)) return {};
    return withViews([...views, { viewId: command.viewId }]);
  },
});

export type SidebarViewChanges = Partial<SidebarView>;

// Changes a section: its name, how many pages it lists, its icons, where
// its pages open, whether it is folded, or the view it shows.
export const setSidebarView = defineCommand<{
  viewId: ViewId;
  changes: SidebarViewChanges;
}>({
  type: "settings.setSidebarView",
  handle(state, command) {
    const views = sidebarViews(state);
    if (!views.some((entry) => entry.viewId === command.viewId)) return {};
    // A view already kept in another section is not shown twice.
    const next = command.changes.viewId;
    if (next !== undefined && next !== command.viewId) {
      if (views.some((entry) => entry.viewId === next)) return {};
    }
    return withViews(
      views.map((entry) =>
        entry.viewId === command.viewId
          ? { ...entry, ...command.changes }
          : entry,
      ),
    );
  },
});

export const removeSidebarView = defineCommand<{ viewId: ViewId }>({
  type: "settings.removeSidebarView",
  handle(state, command) {
    const views = sidebarViews(state);
    const kept = views.filter((entry) => entry.viewId !== command.viewId);
    return kept.length === views.length ? {} : withViews(kept);
  },
});

// Moves a section one place up or down among the sidebar's views.
export const moveSidebarView = defineCommand<{
  viewId: ViewId;
  by: -1 | 1;
}>({
  type: "settings.moveSidebarView",
  handle(state, command) {
    const views = [...sidebarViews(state)];
    const from = views.findIndex((entry) => entry.viewId === command.viewId);
    const to = from + command.by;
    const moved = views[from];
    if (moved === undefined || to < 0 || to >= views.length) return {};
    views.splice(from, 1);
    views.splice(to, 0, moved);
    return withViews(views);
  },
});

export const sidebarViewCommands = [
  addSidebarView,
  setSidebarView,
  removeSidebarView,
  moveSidebarView,
];
