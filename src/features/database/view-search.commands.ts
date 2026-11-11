// What is typed into a view's search field. Interface state only: not
// saved with the workspace and not undone.
import type { ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setViewSearch = defineCommand<{ viewId: ViewId; query: string }>({
  type: "view.setSearch",
  handle(state, command) {
    const viewSearches = {
      ...state.ui.viewSearches,
      [command.viewId]: command.query,
    };
    return { ui: { ...state.ui, viewSearches } };
  },
});

export const viewSearchCommands = [setViewSearch];
