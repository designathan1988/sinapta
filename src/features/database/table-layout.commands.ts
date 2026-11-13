// How a table view lays out its columns: which wrap their text, and how
// many stay in place from the start while it scrolls sideways.
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  DEFAULT_TABLE_OPTIONS,
  type PropertyId,
  type TableOptions,
  type View,
  type ViewId,
} from "../../model/index.ts";
import { defineCommand, type CommandEffect } from "../../state/index.ts";

function patchView(viewId: ViewId, patch: Partial<View>): CommandEffect {
  return {
    operations: [{ type: "record.update", kind: "view", id: viewId, patch }],
  };
}

export const toggleWrapped = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.toggleWrapped",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const { wrappedPropertyIds } = view;
    const isWrapped = wrappedPropertyIds.includes(command.propertyId);
    return patchView(view.id, {
      wrappedPropertyIds: isWrapped
        ? wrappedPropertyIds.filter((id) => id !== command.propertyId)
        : [...wrappedPropertyIds, command.propertyId],
    });
  },
});

// Freezes the first `count` columns, the title column counted; 0 frees
// them all.
export const setFrozenCount = defineCommand<{
  viewId: ViewId;
  count: number;
}>({
  type: "view.setFrozenCount",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const database =
      view === undefined ? undefined : selectDatabase(state, view.databaseId);
    if (view === undefined || database === undefined) return {};
    const columns = database.props.properties.length + 1;
    const count = Math.max(0, Math.min(columns, Math.floor(command.count)));
    if (count === view.frozenCount) return {};
    return patchView(view.id, { frozenCount: count });
  },
});

// A table's layout switches: lines between columns, page icons, and
// every column wrapped.
export const setTableOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<TableOptions>;
}>({
  type: "view.setTableOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const table = {
      ...(view.table ?? DEFAULT_TABLE_OPTIONS),
      ...command.options,
    };
    return patchView(view.id, { table });
  },
});

export const tableLayoutCommands = [
  toggleWrapped,
  setFrozenCount,
  setTableOptions,
];
