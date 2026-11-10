import type { SaveStatus } from "./app-state.ts";
import { defineCommand } from "./command-registry.ts";

export const setSaveStatus = defineCommand<{ status: SaveStatus }>({
  type: "persistence.setSaveStatus",
  handle(state, command) {
    if (command.status === state.persistence.status) return {};
    return { persistence: { ...state.persistence, status: command.status } };
  },
});

export const persistenceCommands = [setSaveStatus];
