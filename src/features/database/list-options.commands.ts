// A list view's options, as Notion's: "Directly edit page name", which
// makes each title a field edited in place.
import type { ListOptions, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const DEFAULT_LIST_OPTIONS: ListOptions = { editTitle: false };

export const setListOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<ListOptions>;
}>({
  type: "view.setListOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const list = { ...(view.list ?? DEFAULT_LIST_OPTIONS), ...command.options };
    return {
      operations: [
        { type: "record.update", kind: "view", id: view.id, patch: { list } },
      ],
    };
  },
});

export const listOptionCommands = [setListOptions];
