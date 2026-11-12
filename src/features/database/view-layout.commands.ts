// Commands that choose how a view lays out its rows: as a table, a board
// grouped by a select property, a gallery, a list or a calendar placed by
// a date property.
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import type { PropertyId, View, ViewId, ViewType } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import { groupByProperty } from "./group.commands.ts";

// The types a board can group by, the one it prefers first.
export const GROUP_PROPERTY_TYPES = ["status", "select"] as const;
export const DATE_PROPERTY_TYPES = ["date"] as const;

// The properties of these types, those of the first type first.
export function propertiesOfTypes(
  database: DatabaseBlock,
  types: readonly string[],
): DatabaseBlock["props"]["properties"] {
  const { properties } = database.props;
  return types.flatMap((type) =>
    properties.filter((property) => property.type === type),
  );
}

function firstOfTypes(
  database: DatabaseBlock,
  types: readonly string[],
): PropertyId | undefined {
  return propertiesOfTypes(database, types)[0]?.id;
}

// What a view of a layout starts with: a board needs a property to group
// by and a calendar one to place rows by. Settings already made are kept,
// so a board made a table stays grouped, as its groups were its columns.
export function layoutDefaults(
  database: DatabaseBlock,
  view: Pick<View, "groupBy" | "datePropertyId">,
  viewType: ViewType,
): Partial<View> {
  const group = firstOfTypes(database, GROUP_PROPERTY_TYPES);
  const date =
    view.datePropertyId ?? firstOfTypes(database, DATE_PROPERTY_TYPES);
  const needsGroup = viewType === "board" && view.groupBy === undefined;
  return {
    type: viewType,
    ...(needsGroup &&
      group !== undefined && { groupBy: groupByProperty(group) }),
    ...(viewType === "calendar" &&
      date !== undefined && { datePropertyId: date }),
    // Notion's gallery shows each page's content on its card.
    ...(viewType === "gallery" && { cardPreview: "content" as const }),
  };
}

interface ViewOfDatabase {
  readonly view: View;
  readonly database: DatabaseBlock;
}

function viewWithDatabase(
  state: AppState,
  viewId: ViewId,
): ViewOfDatabase | undefined {
  const view = state.workspace.views[viewId];
  const database =
    view === undefined ? undefined : selectDatabase(state, view.databaseId);
  return view === undefined || database === undefined
    ? undefined
    : { view, database };
}

function patchView(viewId: ViewId, patch: Partial<View>): CommandEffect {
  return {
    operations: [{ type: "record.update", kind: "view", id: viewId, patch }],
  };
}

export const setViewType = defineCommand<{
  viewId: ViewId;
  viewType: ViewType;
}>({
  type: "view.setType",
  handle(state, command) {
    const found = viewWithDatabase(state, command.viewId);
    if (found === undefined || found.view.type === command.viewType) return {};
    const { view, database } = found;
    return patchView(view.id, layoutDefaults(database, view, command.viewType));
  },
});

// Sets the date property a calendar places rows by.
export const setViewDateProperty = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.setDateProperty",
  handle(state, command) {
    const found = viewWithDatabase(state, command.viewId);
    const property = found?.database.props.properties.find(
      (item) => item.id === command.propertyId,
    );
    if (found === undefined || property === undefined) return {};
    if (!DATE_PROPERTY_TYPES.some((type) => type === property.type)) return {};
    return patchView(found.view.id, { datePropertyId: property.id });
  },
});

export const viewLayoutCommands = [setViewType, setViewDateProperty];
