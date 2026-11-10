import type { Workspace } from "../model/index.ts";
import type { UiState } from "./app-state.ts";
import { defineCommand } from "./command-registry.ts";

export interface LoadWorkspacePayload {
  readonly workspace: Workspace;
  readonly ui: UiState;
  readonly skippedCount: number;
}

// Puts parsed data from storage into the store at startup.
export const loadWorkspace = defineCommand<LoadWorkspacePayload>({
  type: "workspace.load",
  handle: (state, command) => ({
    workspace: command.workspace,
    ui: command.ui,
    persistence: { ...state.persistence, skippedCount: command.skippedCount },
  }),
});

export const workspaceCommands = [loadWorkspace];
