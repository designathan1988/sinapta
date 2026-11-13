// A column's Calculate submenu, as Notion's: None, then a submenu per
// group (Count, Percent, More options), the counts headed by "Show large
// counts as 99+".
import type { CalculationKind } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { setCalculation, setCountCap } from "./calculation.commands.ts";
import {
  calculationGroups,
  type CalculationGroups,
} from "./calculations.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";

const TEXT = COPY.database;

type GroupName = keyof CalculationGroups;

function countCapItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const on = view.countCap === true;
  return [
    {
      label: TEXT.countCap,
      description: TEXT.countCapNote,
      check: "switch",
      isChecked: on,
      keepsOpen: true,
      onSelect: () =>
        context.dispatch(setCountCap.create({ viewId: view.id, on: !on })),
    },
    { kind: "divider" },
  ];
}

const GROUP_NAMES: readonly GroupName[] = ["count", "percent", "more"];

// One group of calculations, as a submenu of the Calculate submenu.
function calculationGroup(
  column: TableColumn,
  context: TableContext,
  group: {
    readonly name: GroupName;
    readonly kinds: readonly CalculationKind[];
  },
): MenuItem {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const propertyId = column.property.id;
  const current = model.view.calculations[propertyId];
  const label = TEXT.calculationGroups[group.name];
  const items: MenuEntry[] = group.kinds.map((kind): MenuItem => ({
    label: TEXT.rollupFunctions[kind],
    check: "radio",
    isChecked: kind === current,
    onSelect: () =>
      dispatch(setCalculation.create({ viewId, propertyId, kind })),
  }));
  // The counts start with Notion's "Show large counts as 99+".
  const head = group.name === "count" ? countCapItems(context) : [];
  return {
    label,
    submenu: {
      id: `${propertyId}:calculate:${group.name}`,
      menu: () => ({
        label,
        items: [...head, ...items],
        isWide: head.length > 0,
      }),
    },
  };
}

// The calculations of a column, as Notion's column menu and footer list
// them: none, then a submenu for each group.
export function calculationItems(
  column: TableColumn,
  context: TableContext,
): MenuItem[] {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const propertyId = column.property.id;
  const groups = calculationGroups(column.property);
  const none: MenuItem = {
    label: TEXT.noGrouping,
    check: "radio",
    isChecked: model.view.calculations[propertyId] === undefined,
    onSelect: () =>
      dispatch(setCalculation.create({ viewId, propertyId, kind: null })),
  };
  return [
    none,
    ...GROUP_NAMES.filter((name) => groups[name].length > 0).map((name) =>
      calculationGroup(column, context, { name, kinds: groups[name] }),
    ),
  ];
}

export function calculateItem(
  column: TableColumn,
  context: TableContext,
): MenuItem {
  const items = calculationItems(column, context);
  return {
    label: TEXT.calculate,
    icon: "sigma",
    submenu: {
      id: `${column.property.id}:calculate`,
      menu: () => ({ label: TEXT.calculate, items }),
    },
  };
}
