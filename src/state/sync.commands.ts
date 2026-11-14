// Changes that come from the server (ADR-0013). They change the workspace
// like any transaction but stay out of this client's undo history.
import type { Operation, Workspace } from "../model/index.ts";
import { createInitialUiState } from "./app-state.ts";
import { defineCommand } from "./command-registry.ts";

// Another client's operations, with this client's unconfirmed ones taken
// back before them and made again after them, as one transaction.
export const applyRemote = defineCommand<{
  operations: readonly Operation[];
}>({
  type: "sync.applyRemote",
  handle: (_state, { operations }) => ({ operations, isRemote: true }),
});

// The workspace as the server holds it, read when this client joins it.
// The open page stays open when the server's workspace has it.
export const loadServerWorkspace = defineCommand<{ workspace: Workspace }>({
  type: "sync.loadServerWorkspace",
  handle: (state, { workspace }) => {
    const { activePageId, sidebarWidth, isSidebarCollapsed } = state.ui;
    const keepsPage =
      activePageId === null || workspace.blocks[activePageId] !== undefined;
    if (keepsPage) return { workspace };
    const ui = { ...createInitialUiState(), sidebarWidth, isSidebarCollapsed };
    return { workspace, ui };
  },
});

export const syncCommands = [applyRemote, loadServerWorkspace];
