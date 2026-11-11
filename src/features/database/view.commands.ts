// Commands on the saved views of a database. Everything a view remembers
// lives in its View record and changes only here.
import type {
  BlockId,
  FilterGroup,
  Operation,
  PropertyId,
  View,
  ViewId,
  ViewType,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import {
  selectHolderOfView,
  selectViewHolder,
  type ViewHolder,
} from "./view-holder.selectors.ts";
import { layoutDefaults } from "./view-layout.commands.ts";

function updateView(
  state: AppState,
  viewId: ViewId,
  patch: Partial<Omit<View, "id">>,
): CommandEffect {
  if (state.workspace.views[viewId] === undefined) return {};
  return {
    operations: [{ type: "record.update", kind: "view", id: viewId, patch }],
  };
}

export interface CreateViewPayload {
  // The database, or the linked view, that gets the view.
  readonly databaseId: BlockId;
  readonly name: string;
  // A table unless given.
  readonly viewType?: ViewType;
}

// The holder, a database or a linked view, with a new list of views.
function withViewIds(
  state: AppState,
  holder: ViewHolder,
  viewIds: readonly ViewId[],
): Operation {
  const block = state.workspace.blocks[holder.holderId];
  const props = { ...block?.props, viewIds: [...viewIds] };
  return {
    type: "record.update",
    kind: "block",
    id: holder.holderId,
    patch: { props },
  };
}

export const createView = defineCommand<CreateViewPayload>({
  type: "view.create",
  newIds: { views: 1 },
  handle(state, command) {
    const holder = selectViewHolder(state, command.databaseId);
    const id = command.meta.viewIds[0];
    if (holder === undefined || id === undefined) return {};
    const { database } = holder;
    const record: View = {
      id,
      databaseId: database.id,
      name: command.name,
      type: "table",
      sorts: [],
      filter: { conjunction: "and", items: [] },
      propertyOrder: [],
      propertyWidths: {},
      hiddenPropertyIds: [],
      calculations: {},
      ...layoutDefaults(database, {}, command.viewType ?? "table"),
    };
    return {
      operations: [
        { type: "record.create", kind: "view", record },
        withViewIds(state, holder, [...holder.viewIds, id]),
      ],
      ui: {
        ...state.ui,
        activeViewIds: { ...state.ui.activeViewIds, [holder.holderId]: id },
      },
    };
  },
});

export const renameView = defineCommand<{ viewId: ViewId; name: string }>({
  type: "view.rename",
  handle: (state, command) =>
    updateView(state, command.viewId, { name: command.name }),
});

// Deletes a view. A database always keeps at least one.
export const deleteView = defineCommand<{ viewId: ViewId }>({
  type: "view.delete",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const holder =
      view === undefined ? undefined : selectHolderOfView(state, view);
    if (view === undefined || holder === undefined) return {};
    const viewIds = holder.viewIds.filter((id) => id !== view.id);
    if (viewIds.length === 0) return {};
    const { [holder.holderId]: _active, ...activeViewIds } =
      state.ui.activeViewIds;
    return {
      operations: [
        withViewIds(state, holder, viewIds),
        { type: "record.delete", kind: "view", id: view.id },
      ],
      ui: { ...state.ui, activeViewIds },
    };
  },
});

export type Sort = View["sorts"][number];

export const setViewSorts = defineCommand<{
  viewId: ViewId;
  sorts: readonly Sort[];
}>({
  type: "view.setSorts",
  handle: (state, command) =>
    updateView(state, command.viewId, { sorts: [...command.sorts] }),
});

export interface SortByPayload {
  readonly viewId: ViewId;
  readonly propertyId: PropertyId;
  // Null removes the sort on this property.
  readonly direction: Sort["direction"] | null;
  // True keeps the view's other sorts; false leaves only this one.
  readonly keepOthers: boolean;
}

// Sorts a view by one property. A property already sorted keeps its place
// in the order; a new one goes last.
export const sortByProperty = defineCommand<SortByPayload>({
  type: "view.sortBy",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const { propertyId, direction, keepOthers } = command;
    const own = direction === null ? [] : [{ propertyId, direction }];
    const isSorted = view.sorts.some((sort) => sort.propertyId === propertyId);
    const kept = view.sorts.flatMap((sort) =>
      sort.propertyId === propertyId ? own : [sort],
    );
    const merged = isSorted ? kept : [...view.sorts, ...own];
    return updateView(state, view.id, { sorts: keepOthers ? merged : own });
  },
});

// Replaces the view's whole filter: its conditions and groups.
export const setViewFilter = defineCommand<{
  viewId: ViewId;
  filter: FilterGroup;
}>({
  type: "view.setFilter",
  handle: (state, command) =>
    updateView(state, command.viewId, { filter: command.filter }),
});

export const MIN_COLUMN_WIDTH = 80;
export const MAX_COLUMN_WIDTH = 800;

export interface ResizePropertyPayload {
  readonly viewId: ViewId;
  readonly propertyId: PropertyId;
  // Column width in CSS pixels.
  readonly width: number;
}

export const resizeProperty = defineCommand<ResizePropertyPayload>({
  type: "view.resizeProperty",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const width = Math.round(
      Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, command.width)),
    );
    const propertyWidths = {
      ...view.propertyWidths,
      [command.propertyId]: width,
    };
    return updateView(state, view.id, { propertyWidths });
  },
});

export const setPropertyOrder = defineCommand<{
  viewId: ViewId;
  propertyOrder: readonly PropertyId[];
}>({
  type: "view.setPropertyOrder",
  handle: (state, command) =>
    updateView(state, command.viewId, {
      propertyOrder: [...command.propertyOrder],
    }),
});

export const togglePropertyHidden = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.togglePropertyHidden",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const isHidden = view.hiddenPropertyIds.includes(command.propertyId);
    const hiddenPropertyIds = isHidden
      ? view.hiddenPropertyIds.filter((id) => id !== command.propertyId)
      : [...view.hiddenPropertyIds, command.propertyId];
    return updateView(state, view.id, { hiddenPropertyIds });
  },
});

// Which view of a database is shown. Interface state, not workspace data.
export const setActiveView = defineCommand<{
  databaseId: BlockId;
  viewId: ViewId;
}>({
  type: "ui.setActiveView",
  handle(state, command) {
    if (state.workspace.views[command.viewId] === undefined) return {};
    const activeViewIds = {
      ...state.ui.activeViewIds,
      [command.databaseId]: command.viewId,
    };
    return { ui: { ...state.ui, activeViewIds, activeCell: null } };
  },
});

export const viewCommands = [
  createView,
  renameView,
  deleteView,
  setViewSorts,
  sortByProperty,
  setViewFilter,
  resizeProperty,
  setPropertyOrder,
  togglePropertyHidden,
  setActiveView,
];
