// Opening a row from a view, as the view says: in a peek beside the
// database or over it, which keep the database the open page, or as the
// row's own page.
import type { BlockId, View, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const openRow = defineCommand<{ rowId: BlockId; viewId: ViewId }>({
  type: "row.open",
  handle(state, command) {
    const { rowId, viewId } = command;
    const view = state.workspace.views[viewId];
    const mode = view?.openMode ?? "full";
    if (mode === "full") {
      return {
        ui: { ...state.ui, activePageId: rowId, activeCell: null, peek: null },
      };
    }
    return { ui: { ...state.ui, peek: { pageId: rowId, viewId, mode } } };
  },
});

export const setOpenMode = defineCommand<{
  viewId: ViewId;
  openMode: View["openMode"];
}>({
  type: "view.setOpenMode",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const patch = { openMode: command.openMode };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const rowOpenCommands = [openRow, setOpenMode];
