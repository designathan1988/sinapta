// The workspace's records as the rebase reads them: a block, a view, the
// settings, each as the browser has it now.
import type { Workspace } from "../model/index.ts";

export function currentRecords(workspace: Workspace) {
  return {
    block: (id: keyof Workspace["blocks"]) => workspace.blocks[id],
    view: (id: keyof Workspace["views"]) => workspace.views[id],
    settings: workspace.settings,
  };
}
