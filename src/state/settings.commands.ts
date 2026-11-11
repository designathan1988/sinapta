import type { Theme } from "../model/index.ts";
import type { AppState } from "./app-state.ts";
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

export const settingsCommands = [setTheme, toggleTheme];
