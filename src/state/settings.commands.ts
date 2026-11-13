import type { Theme, ViewTabStyle } from "../model/index.ts";
import type { AppState } from "./app-state.ts";
import { sidebarViewCommands } from "./sidebar-views.commands.ts";
import {
  defineCommand,
  type CommandEffect,
  type NoPayload,
} from "./command-registry.ts";

function changeTheme(state: AppState, theme: Theme): CommandEffect {
  if (theme === state.workspace.settings.theme) return {};
  return {
    operations: [{ type: "record.update", kind: "settings", patch: { theme } }],
  };
}

export const setTheme = defineCommand<{ theme: Theme }>({
  type: "settings.setTheme",
  handle: (state, command) => changeTheme(state, command.theme),
});

// The Ctrl+Shift+L switch: dark becomes light, and light or the system
// setting becomes dark.
export const toggleTheme = defineCommand<NoPayload>({
  type: "settings.toggleTheme",
  handle: (state) =>
    changeTheme(
      state,
      state.workspace.settings.theme === "dark" ? "light" : "dark",
    ),
});

// How view tabs show, for the owner alone: kept with the settings, so
// outside undo, as Notion's "Only for you".
export const setViewTabStyle = defineCommand<{ style: ViewTabStyle }>({
  type: "settings.setViewTabStyle",
  handle: (state, command) => {
    const current = state.workspace.settings.viewTabStyle ?? "text-icon";
    if (command.style === current) return {};
    const patch = { viewTabStyle: command.style };
    return {
      operations: [{ type: "record.update", kind: "settings", patch }],
    };
  },
});

export const settingsCommands = [
  setTheme,
  toggleTheme,
  setViewTabStyle,
  ...sidebarViewCommands,
];
