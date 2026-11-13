// The group panel: the properties a view can group by, searchable, and
// once grouped, how its groups show.
import type { PropertyDefinition } from "../../../blocks/database/index.ts";
import type { GroupBy } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../../ui/menu/index.ts";
import { setGroupOptions, setViewGroupBy } from "../group.commands.ts";
import {
  groupableProperties,
  groupPropertyOf,
} from "../row-groups.selectors.ts";
import type { TableContext } from "../table-cell.view.ts";
import { groupByKindRows } from "./group-by-panels.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

import { propertyIcon, TITLE_PROPERTY_ID } from "../table-model.selectors.ts";
const NO_GROUP = "";

// Names in the order Notion lists them: by character code, so "URL"
// comes before "Última edição".
function byName(a: PropertyDefinition, b: PropertyDefinition): number {
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
}

// The properties to group by as Notion lists them: None, the title
// column, then the others by name, the current one checked; choosing one
// shows the group panel with its settings.
export function groupByItems(context: TableContext): MenuItem[] {
  const { model, dispatch } = context;
  const groupable = groupableProperties(model.database);
  const isTitle = (property: PropertyDefinition) =>
    property.id === TITLE_PROPERTY_ID;
  const ordered = [
    ...groupable.filter(isTitle),
    ...groupable.filter((property) => !isTitle(property)).sort(byName),
  ];
  return choiceItems(context, {
    choices: [
      { value: NO_GROUP, label: COPY.database.noGrouping, isFlush: true },
      ...ordered.map((property) => ({
        value: property.id,
        label: property.name,
        icon: propertyIcon(property),
      })),
    ],
    value: model.view.groupBy?.propertyId ?? NO_GROUP,
    back: "group",
    choose: (id) => {
      const property = groupable.find((item) => item.id === id);
      if (id !== NO_GROUP && property === undefined) return;
      const propertyId = property?.id ?? null;
      dispatch(setViewGroupBy.create({ viewId: model.view.id, propertyId }));
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
  const icon = propertyIcon(property);
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
  const property = groupPropertyOf(database, view.groupBy?.propertyId);
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
