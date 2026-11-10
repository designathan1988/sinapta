import type { Theme } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export const setTheme = defineCommand<{ theme: Theme }>({
  type: "settings.setTheme",
  handle(state, command) {
    if (command.theme === state.workspace.settings.theme) return {};
    return {
      operations: [
        {
          type: "record.update",
          kind: "settings",
          patch: { theme: command.theme },
        },
      ],
    };
  },
});

export const settingsCommands = [setTheme];
