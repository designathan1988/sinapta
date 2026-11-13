// Hiding the database's name over an inline or linked view's tabs, as
// Notion's "Hide data source titles" and "Show data source title".
import type { ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setSourceTitleHidden = defineCommand<{
  viewId: ViewId;
  isHidden: boolean;
}>({
  type: "view.setSourceTitleHidden",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const patch = { isSourceTitleHidden: command.isHidden };
    return {
      operations: [{ type: "record.update", kind: "view", id: view.id, patch }],
    };
  },
});

export const sourceTitleCommands = [setSourceTitleHidden];
