// Locking a view, as Notion's: its filters, sorts, grouping and layout
// stay as they are until it is unlocked. The page lock's guard refuses
// the changes.
import type { ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setViewLocked = defineCommand<{
  viewId: ViewId;
  isLocked: boolean;
}>({
  type: "view.setLocked",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const patch = { isLocked: command.isLocked };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const viewLockCommands = [setViewLocked];
