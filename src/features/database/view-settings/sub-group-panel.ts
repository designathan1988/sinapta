// A board's sub-groups, as Notion's: with none, the properties to choose
// from; once chosen, the property, the lanes' order, whether empty lanes
// show, and a way to stop.
import type { GroupBy } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../../ui/menu/index.ts";
import { propertyType } from "../property-registry.ts";
import { isGroupable } from "../row-groups.selectors.ts";
import {
  setSubGroupOptions,
  setViewSubGroupBy,
} from "../sub-group.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { GROUP_SORTS } from "./choice-panels.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;

// The properties a board can sub-group by: groupable, not its grouping.
function subGroupChoices(context: TableContext) {
  const { view, database } = context.model;
  return database.props.properties
    .filter(
      (property) =>
        isGroupable(property) && property.id !== view.groupBy?.propertyId,
    )
    .map((property) => ({
      value: property.id,
      label: property.name,
      icon: propertyType(property.type).icon,
    }));
}

function chooseSubGroup(context: TableContext, back: string): MenuItem[] {
  const { model, dispatch } = context;
  const choices = subGroupChoices(context);
  return choiceItems(context, {
    choices,
    value: model.view.subGroupBy?.propertyId,
    back,
    choose: (id) => {
      const propertyId = choices.find((item) => item.value === id)?.value;
      if (propertyId === undefined) return;
      dispatch(setViewSubGroupBy.create({ viewId: model.view.id, propertyId }));
    },
  });
}

function options(context: TableContext, change: Partial<GroupBy>): void {
  const viewId = context.model.view.id;
  context.dispatch(setSubGroupOptions.create({ viewId, options: change }));
}

// Hiding empty lanes, and stopping the sub-grouping.
function stopItems(context: TableContext, subGroupBy: GroupBy): MenuEntry[] {
  const viewId = context.model.view.id;
  return [
    {
      label: TEXT.hideEmptyGroups,
      check: "switch",
      isChecked: subGroupBy.hideEmpty,
      onSelect: () => {
        options(context, { hideEmpty: !subGroupBy.hideEmpty });
      },
    },
    { kind: "divider" },
    {
      label: TEXT.removeSubGroup,
      icon: "trash",
      isDanger: true,
      keepsOpen: true,
      onSelect: () =>
        context.dispatch(
          setViewSubGroupBy.create({ viewId, propertyId: null }),
        ),
    },
  ];
}

function subGroupedItems(
  context: TableContext,
  subGroupBy: GroupBy,
): MenuEntry[] {
  const property = context.model.database.props.properties.find(
    (item) => item.id === subGroupBy.propertyId,
  );
  const icon =
    property === undefined ? "group" : propertyType(property.type).icon;
  return [
    panelRow(
      context,
      { label: TEXT.subGroupBy, icon, value: property?.name ?? "" },
      "sub-group-by",
    ),
    panelRow(
      context,
      {
        label: TEXT.sortRow,
        icon: "sort",
        value: TEXT.groupSorts[subGroupBy.sort],
      },
      "sub-group-sort",
    ),
    ...stopItems(context, subGroupBy),
  ];
}

export function subGroupPanel(context: TableContext): SettingsPanel {
  const { subGroupBy } = context.model.view;
  return {
    title: TEXT.subGroup,
    back: "group",
    items:
      subGroupBy === undefined
        ? chooseSubGroup(context, "sub-group")
        : subGroupedItems(context, subGroupBy),
  };
}

export function subGroupByPanel(context: TableContext): SettingsPanel {
  return {
    title: TEXT.subGroupBy,
    back: "sub-group",
    items: chooseSubGroup(context, "sub-group"),
  };
}

export function subGroupSortPanel(context: TableContext): SettingsPanel {
  const labels = TEXT.groupSorts;
  return {
    title: TEXT.sortRow,
    back: "sub-group",
    items: choiceItems(context, {
      choices: GROUP_SORTS.map((value) => ({ value, label: labels[value] })),
      value: context.model.view.subGroupBy?.sort,
      back: "sub-group",
      choose: (sort) => {
        options(context, { sort });
      },
    }),
  };
}
