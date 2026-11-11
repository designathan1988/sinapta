// Commands on how a view groups its rows. The grouping lives in the
// view's record: it is saved, shared by the view's layouts and undone.
import { selectDatabase } from "../../blocks/database/index.ts";
import type { GroupBy, PropertyId, View, ViewId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import { isGroupable } from "./row-groups.selectors.ts";

export function groupByProperty(propertyId: PropertyId): GroupBy {
  return {
    propertyId,
    sort: "manual",
    hideEmpty: false,
    collapsed: [],
    dateBy: "month",
    order: [],
    hidden: [],
  };
}

function patchView(viewId: ViewId, patch: Partial<View>): CommandEffect {
  return {
    operations: [{ type: "record.update", kind: "view", id: viewId, patch }],
  };
}

function groupedBy(
  state: AppState,
  view: View,
  propertyId: PropertyId,
): GroupBy | undefined {
  const property = selectDatabase(
    state,
    view.databaseId,
  )?.props.properties.find((item) => item.id === propertyId);
  if (property === undefined || !isGroupable(property)) return undefined;
  if (view.groupBy === undefined) return groupByProperty(propertyId);
  return { ...view.groupBy, propertyId, collapsed: [], order: [], hidden: [] };
}

// Groups a view by a property, keeping how it sorted and hid groups; null
// stops grouping.
export const setViewGroupBy = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId | null;
}>({
  type: "view.setGroupBy",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    if (command.propertyId === null) {
      if (view.groupBy === undefined) return {};
      return patchView(view.id, { groupBy: undefined });
    }
    if (view.groupBy?.propertyId === command.propertyId) return {};
    const groupBy = groupedBy(state, view, command.propertyId);
    return groupBy === undefined ? {} : patchView(view.id, { groupBy });
  },
});

export type GroupOptions = Partial<
  Pick<GroupBy, "sort" | "hideEmpty" | "dateBy">
>;

export const setGroupOptions = defineCommand<{
  viewId: ViewId;
  options: GroupOptions;
}>({
  type: "view.setGroupOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view?.groupBy === undefined) return {};
    return patchView(view.id, {
      groupBy: { ...view.groupBy, ...command.options },
    });
  },
});

export const toggleGroupCollapsed = defineCommand<{
  viewId: ViewId;
  key: string;
}>({
  type: "view.toggleGroupCollapsed",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view?.groupBy === undefined) return {};
    const { collapsed } = view.groupBy;
    const next = collapsed.includes(command.key)
      ? collapsed.filter((key) => key !== command.key)
      : [...collapsed, command.key];
    return patchView(view.id, {
      groupBy: { ...view.groupBy, collapsed: next },
    });
  },
});

// Places groups by hand: these keys first, in this order.
export const setGroupOrder = defineCommand<{
  viewId: ViewId;
  order: readonly string[];
}>({
  type: "view.setGroupOrder",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view?.groupBy === undefined) return {};
    const order = [...new Set(command.order)];
    return patchView(view.id, { groupBy: { ...view.groupBy, order } });
  },
});

export const toggleGroupHidden = defineCommand<{
  viewId: ViewId;
  key: string;
}>({
  type: "view.toggleGroupHidden",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view?.groupBy === undefined) return {};
    const { hidden } = view.groupBy;
    const next = hidden.includes(command.key)
      ? hidden.filter((key) => key !== command.key)
      : [...hidden, command.key];
    return patchView(view.id, { groupBy: { ...view.groupBy, hidden: next } });
  },
});

export const groupCommands = [
  setViewGroupBy,
  setGroupOptions,
  toggleGroupCollapsed,
  setGroupOrder,
  toggleGroupHidden,
];
