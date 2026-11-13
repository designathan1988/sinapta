// The group panel: the properties a view can group by, searchable, and
// once grouped, how its groups show.
import type { PropertyDefinition } from "../../../blocks/database/index.ts";
import type { GroupBy } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../../ui/menu/index.ts";
import { setGroupOptions, setViewGroupBy } from "../group.commands.ts";
import { propertyType } from "../property-registry.ts";
import { isGroupable } from "../row-groups.selectors.ts";
import type { TableContext } from "../table-cell.view.ts";
import { groupByKindRows } from "./group-by-panels.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

// The properties to group by, the current one checked; choosing one
// shows the group panel with its settings.
export function groupByItems(context: TableContext): MenuItem[] {
  const { model, dispatch } = context;
  const groupable = model.database.props.properties.filter(isGroupable);
  return choiceItems(context, {
    choices: groupable.map((property) => ({
      value: property.id,
      label: property.name,
      icon: propertyType(property.type).icon,
    })),
    value: model.view.groupBy?.propertyId,
    back: "group",
    choose: (id) => {
      const property = groupable.find((item) => item.id === id);
      if (property === undefined) return;
      const viewId = model.view.id;
      dispatch(setViewGroupBy.create({ viewId, propertyId: property.id }));
    },
  });
}

function hideEmptyRow(context: TableContext, groupBy: GroupBy): MenuItem {
  const viewId = context.model.view.id;
  return {
    label: COPY.database.hideEmptyGroups,
    check: "switch",
    isChecked: groupBy.hideEmpty,
    onSelect: () =>
      context.dispatch(
        setGroupOptions.create({
          viewId,
          options: { hideEmpty: !groupBy.hideEmpty },
        }),
      ),
  };
}

// A board's lanes, as Notion's Sub-group row.
function subGroupRows(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  if (view.type !== "board") return [];
  const property = database.props.properties.find(
    (item) => item.id === view.subGroupBy?.propertyId,
  );
  const row = {
    label: COPY.database.subGroup,
    icon: "group",
    value: property?.name ?? COPY.database.noSubGroup,
  } as const;
  return [panelRow(context, row, "sub-group")];
}

// A board always groups, so only other layouts can stop grouping.
function removeRows(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  if (view.type === "board") return [];
  const viewId = view.id;
  return [
    { kind: "divider" },
    {
      label: COPY.database.removeGrouping,
      icon: "trash",
      isDanger: true,
      keepsOpen: true,
      onSelect: () =>
        context.dispatch(setViewGroupBy.create({ viewId, propertyId: null })),
    },
  ];
}

function groupedItems(
  context: TableContext,
  property: PropertyDefinition,
): MenuEntry[] {
  const { groupBy } = context.model.view;
  if (groupBy === undefined) return [];
  const { dateSteps, groupSorts } = COPY.database;
  const icon = propertyType(property.type).icon;
  const dateStep = dateSteps[groupBy.dateBy];
  const dateRow = panelRow(
    context,
    { label: COPY.database.dateStep, icon: "calendar", value: dateStep },
    "group-date",
  );
  const sort = groupSorts[groupBy.sort];
  return [
    panelRow(
      context,
      { label: COPY.database.groupBy, icon, value: property.name },
      "group-by",
    ),
    ...(property.type === "date" ? [dateRow] : []),
    ...groupByKindRows(context, property, groupBy),
    panelRow(
      context,
      { label: COPY.database.sortRow, icon: "sort", value: sort },
      "group-sort",
    ),
    hideEmptyRow(context, groupBy),
    ...subGroupRows(context),
    ...removeRows(context),
  ];
}

export function groupPanel(context: TableContext): SettingsPanel {
  const { view, database } = context.model;
  const property = database.props.properties.find(
    (item) => item.id === view.groupBy?.propertyId,
  );
  if (property === undefined) {
    return {
      title: COPY.database.groupBy,
      back: null,
      search: COPY.database.searchProperty,
      items: groupByItems(context),
    };
  }
  return {
    title: COPY.database.group,
    back: null,
    items: groupedItems(context, property),
  };
}
