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

export const GROUP_PROPERTY_TYPE = "select";
export const DATE_PROPERTY_TYPE = "date";

function firstOfType(
  database: DatabaseBlock,
  type: string,
): PropertyId | undefined {
  return database.props.properties.find((property) => property.type === type)
    ?.id;
}

// What a view of a layout starts with: a board needs a property to group
// by and a calendar one to place rows by. Settings already made are kept.
export function layoutDefaults(
  database: DatabaseBlock,
  view: Pick<View, "groupPropertyId" | "datePropertyId">,
  viewType: ViewType,
): Partial<View> {
  const group =
    view.groupPropertyId ?? firstOfType(database, GROUP_PROPERTY_TYPE);
  const date = view.datePropertyId ?? firstOfType(database, DATE_PROPERTY_TYPE);
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

// Sets the property a layout uses, if it is of the type that layout needs.
function setLayoutProperty(
  key: "groupPropertyId" | "datePropertyId",
  propertyType: string,
) {
  return (
    state: AppState,
    command: { readonly viewId: ViewId; readonly propertyId: PropertyId },
  ): CommandEffect => {
    const found = viewWithDatabase(state, command.viewId);
    const property = found?.database.props.properties.find(
      (item) => item.id === command.propertyId,
    );
    if (found === undefined || property?.type !== propertyType) return {};
    return patchView(found.view.id, { [key]: property.id });
  };
}

export const setViewGroupProperty = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.setGroupProperty",
  handle: setLayoutProperty("groupPropertyId", GROUP_PROPERTY_TYPE),
});

export const setViewDateProperty = defineCommand<{
  viewId: ViewId;
  propertyId: PropertyId;
}>({
  type: "view.setDateProperty",
  handle: setLayoutProperty("datePropertyId", DATE_PROPERTY_TYPE),
});

export const viewLayoutCommands = [
  setViewType,
  setViewGroupProperty,
  setViewDateProperty,
];
