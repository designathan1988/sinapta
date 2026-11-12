// A board's sub-groups, as Notion's: a second property sorts the cards
// into lanes across the board, each lane holding every column.
import { selectDatabase } from "../../blocks/database/index.ts";
import type { PropertyId, View, ViewId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import { groupByProperty } from "./group.commands.ts";
import { isGroupable } from "./row-groups.selectors.ts";

function patchView(viewId: ViewId, patch: Partial<View>): CommandEffect {
  return {
    operations: [{ type: "record.update", kind: "view", id: viewId, patch }],
  };
}

function canSubGroup(
  state: AppState,
  view: View,
  propertyId: PropertyId,
): boolean {
  if (view.groupBy?.propertyId === propertyId) return false;
  const property = selectDatabase(
    state,
    view.databaseId,
  )?.props.properties.find((item) => item.id === propertyId);
  return property !== undefined && isGroupable(property);
}

// Sub-groups a board by a property, or, given null, stops.
export const setViewSubGroupBy = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId | null;
}>({
  type: "view.setSubGroupBy",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const { propertyId } = command;
    if (propertyId === null) {
      return view.subGroupBy === undefined
        ? {}
        : patchView(view.id, { subGroupBy: undefined });
    }
    if (view.subGroupBy?.propertyId === propertyId) return {};
    if (!canSubGroup(state, view, propertyId)) return {};
    return patchView(view.id, { subGroupBy: groupByProperty(propertyId) });
  },
});

export const toggleSubGroupCollapsed = defineCommand<{
  viewId: ViewId;
  key: string;
}>({
  type: "view.toggleSubGroupCollapsed",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const subGroupBy = view?.subGroupBy;
    if (view === undefined || subGroupBy === undefined) return {};
    const { collapsed } = subGroupBy;
    const next = collapsed.includes(command.key)
      ? collapsed.filter((key) => key !== command.key)
      : [...collapsed, command.key];
    return patchView(view.id, {
      subGroupBy: { ...subGroupBy, collapsed: next },
    });
  },
});

export const subGroupCommands = [setViewSubGroupBy, toggleSubGroupCollapsed];
