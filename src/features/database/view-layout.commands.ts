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
// by and a calendar one to place rows by. Settings already made are kept.
export function layoutDefaults(
  database: DatabaseBlock,
  view: Pick<View, "groupPropertyId" | "datePropertyId">,
  viewType: ViewType,
): Partial<View> {
  const group =
    view.groupPropertyId ?? firstOfTypes(database, GROUP_PROPERTY_TYPES);
  const date =
    view.datePropertyId ?? firstOfTypes(database, DATE_PROPERTY_TYPES);
  return {
    type: viewType,
    ...(viewType === "board" &&
      group !== undefined && { groupPropertyId: group }),
    ...(viewType === "calendar" &&
      date !== undefined && { datePropertyId: date }),
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

// Sets the property a layout uses, if it is of a type that layout needs.
function setLayoutProperty(
  key: "groupPropertyId" | "datePropertyId",
  types: readonly string[],
) {
  return (
    state: AppState,
    command: { readonly viewId: ViewId; readonly propertyId: PropertyId },
  ): CommandEffect => {
    const found = viewWithDatabase(state, command.viewId);
    const property = found?.database.props.properties.find(
      (item) => item.id === command.propertyId,
    );
    if (found === undefined || property === undefined) return {};
    if (!types.includes(property.type)) return {};
    return patchView(found.view.id, { [key]: property.id });
  };
}

export const setViewGroupProperty = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.setGroupProperty",
  handle: setLayoutProperty("groupPropertyId", GROUP_PROPERTY_TYPES),
});

export const setViewDateProperty = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.setDateProperty",
  handle: setLayoutProperty("datePropertyId", DATE_PROPERTY_TYPES),
});

export const viewLayoutCommands = [
  setViewType,
  setViewGroupProperty,
  setViewDateProperty,
];
