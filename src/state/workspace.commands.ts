import type { Workspace } from "../model/index.ts";
import { createInitialUiState, type UiState } from "./app-state.ts";
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

export interface ImportWorkspacePayload {
  readonly workspace: Workspace;
  readonly skippedCount: number;
}

// Replaces the whole workspace with an imported one. Nothing of the old
// workspace is kept, so the interface state that points into it is reset.
export const importWorkspace = defineCommand<ImportWorkspacePayload>({
  type: "workspace.import",
  handle(state, command) {
    const { sidebarWidth, isSidebarCollapsed } = state.ui;
    return {
      workspace: command.workspace,
      ui: { ...createInitialUiState(), sidebarWidth, isSidebarCollapsed },
      persistence: {
        ...state.persistence,
        skippedCount: command.skippedCount,
        pendingImport: null,
        importError: null,
      },
    };
  },
});

export const workspaceCommands = [loadWorkspace, importWorkspace];
