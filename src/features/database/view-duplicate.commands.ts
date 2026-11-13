// Duplicating a view, as Notion's "Duplicate view": a copy with every
// setting, named after it, placed after it and opened.
import type { ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectHolderOfView } from "./view-holder.selectors.ts";

export const duplicateView = defineCommand<{ viewId: ViewId }>({
  type: "view.duplicate",
  newIds: { views: 1 },
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const holder =
      view === undefined ? undefined : selectHolderOfView(state, view);
    const id = command.meta.viewIds[0];
    if (view === undefined || holder === undefined || id === undefined)
      return {};
    const record = { ...view, id, name: COPY.database.copyName(view.name) };
    const at = holder.viewIds.indexOf(view.id) + 1;
    const viewIds = [
      ...holder.viewIds.slice(0, at),
      id,
      ...holder.viewIds.slice(at),
    ];
    const block = state.workspace.blocks[holder.holderId];
    const props = { ...block?.props, viewIds };
    return {
      operations: [
        { type: "record.create", kind: "view", record },
        {
          type: "record.update",
          kind: "block",
          id: holder.holderId,
          patch: { props },
        },
      ],
      ui: {
        ...state.ui,
        activeViewIds: { ...state.ui.activeViewIds, [holder.holderId]: id },
      },
    };
  },
});

export const viewDuplicateCommands = [duplicateView];
