// The sidebar as the owner arranges it in "Customize sidebar", as Notion's:
// the order of its shortcuts and sections, which are shown, and how many
// favorites it lists. The owner's own, kept with the settings and outside
// undo.
import type { Settings } from "../model/index.ts";
import { defineCommand, type CommandEffect } from "./command-registry.ts";

function withSettings(patch: Partial<Settings>): CommandEffect {
  return { operations: [{ type: "record.update", kind: "settings", patch }] };
}

export const setSidebarShortcuts = defineCommand<{ keys: readonly string[] }>({
  type: "settings.setSidebarShortcuts",
  handle: (_state, command) =>
    withSettings({ sidebarShortcuts: [...new Set(command.keys)] }),
});

export const setSidebarSections = defineCommand<{ keys: readonly string[] }>({
  type: "settings.setSidebarSections",
  handle: (_state, command) =>
    withSettings({ sidebarSections: [...new Set(command.keys)] }),
});

export const setFavoritesLimit = defineCommand<{
  limit: NonNullable<Settings["favoritesLimit"]>;
}>({
  type: "settings.setFavoritesLimit",
  handle: (_state, command) => withSettings({ favoritesLimit: command.limit }),
});

export const sidebarLayoutCommands = [
  setSidebarShortcuts,
  setSidebarSections,
  setFavoritesLimit,
];
