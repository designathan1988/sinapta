// The rows of a column's menu, as Notion's: filter, the Sort and
// Calculate submenus, group, and how the table shows the column.
import type { CalculationKind } from "../../model/index.ts";
import { openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { setCalculation } from "./calculation.commands.ts";
import {
  calculationGroups,
  type CalculationGroups,
} from "./calculations.selectors.ts";
import { addFilter } from "./filter-edit.ts";
import { firstOperator } from "./filter-fields.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { isGroupable } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setFrozenCount, toggleWrapped } from "./table-layout.commands.ts";
import type { TableColumn } from "./table-model.selectors.ts";
import { FILTERS_OVERLAY } from "./view-filters.view.ts";
import {
  setViewFilter,
  sortByProperty,
  togglePropertyHidden,
} from "./view.commands.ts";

const TEXT = COPY.database;

type Direction = "ascending" | "descending";

// "Then sort" adds this column to a sort that other columns started;
// "Clear sort" shows while the column sorts.
function sortItems(column: TableColumn, context: TableContext): MenuItem[] {
  const { view } = context.model;
  const propertyId = column.property.id;
  const sort = (direction: Direction | null, keepOthers: boolean) => () =>
    context.dispatch(
      sortByProperty.create({
        viewId: view.id,
        propertyId,
        direction,
        keepOthers,
      }),
    );
  const item = (label: string, direction: Direction, keepOthers = false) => ({
    label,
    icon: direction === "ascending" ? ("up" as const) : ("down" as const),
    onSelect: sort(direction, keepOthers),
  });
  const hasOtherSort = view.sorts.some((one) => one.propertyId !== propertyId);
  const then = [
    item(TEXT.thenAscending, "ascending", true),
    item(TEXT.thenDescending, "descending", true),
  ];
  const clear = {
    label: TEXT.clearSort,
    icon: "close" as const,
    onSelect: sort(null, true),
  };
  return [
    item(TEXT.sortAscending, "ascending"),
    item(TEXT.sortDescending, "descending"),
    ...(hasOtherSort ? then : []),
    ...(column.sortDirection === undefined ? [] : [clear]),
  ];
}

export function sortItem(column: TableColumn, context: TableContext): MenuItem {
  const items = sortItems(column, context);
  return {
    label: TEXT.sort,
    icon: "sort",
    submenu: {
      id: `${column.property.id}:sort`,
      menu: () => ({ label: TEXT.sort, items }),
    },
  };
}

type GroupName = keyof CalculationGroups;

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
  const items = group.kinds.map((kind): MenuItem => ({
    label: TEXT.rollupFunctions[kind],
    check: "radio",
    isChecked: kind === current,
    onSelect: () =>
      dispatch(setCalculation.create({ viewId, propertyId, kind })),
  }));
  return {
    label,
    submenu: {
      id: `${propertyId}:calculate:${group.name}`,
      menu: () => ({ label, items }),
    },
  };
}

// The calculation under the column: none, or one of Notion's groups.
export function calculateItem(
  column: TableColumn,
  context: TableContext,
): MenuItem {
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
  const items = [
    none,
    ...GROUP_NAMES.filter((name) => groups[name].length > 0).map((name) =>
      calculationGroup(column, context, { name, kinds: groups[name] }),
    ),
  ];
  return {
    label: TEXT.calculate,
    icon: "sigma",
    submenu: {
      id: `${propertyId}:calculate`,
      menu: () => ({ label: TEXT.calculate, items }),
    },
  };
}

// Adds a condition on this column and opens the view's filter.
export function filterItem(
  column: TableColumn,
  context: TableContext,
): MenuItem {
  const { model, dispatch } = context;
  const onSelect = (): void => {
    const filter = {
      propertyId: column.property.id,
      operator: firstOperator(column.property),
      value: "",
    };
    const next = addFilter(model.view.filter, [], filter);
    dispatch(setViewFilter.create({ viewId: model.view.id, filter: next }));
    const overlay = { kind: FILTERS_OVERLAY, anchorId: model.holderId };
    dispatch(openOverlay.create({ overlay }));
  };
  return { label: TEXT.filter, icon: "filter", onSelect };
}

// Groups the view by this column, when its type can group.
export function groupItems(
  column: TableColumn,
  context: TableContext,
): MenuItem[] {
  if (!isGroupable(column.property)) return [];
  const viewId = context.model.view.id;
  const propertyId = column.property.id;
  const onSelect = (): void => {
    context.dispatch(setViewGroupBy.create({ viewId, propertyId }));
  };
  return [{ label: TEXT.group, icon: "group", onSelect }];
}

// How the table shows the column: frozen with the ones before it, hidden
// in this view, its text wrapped.
export function showItems(
  column: TableColumn,
  context: TableContext,
): MenuItem[] {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const propertyId = column.property.id;
  const count = model.columns.indexOf(column) + 1;
  const isFrozenHere = model.view.frozenCount === count;
  const hide: MenuItem = {
    label: TEXT.hide,
    icon: "eye-off",
    onSelect: () =>
      dispatch(togglePropertyHidden.create({ viewId, propertyId })),
  };
  return [
    {
      label: isFrozenHere ? TEXT.unfreezeColumns : TEXT.freezeColumns,
      icon: "freeze",
      onSelect: () =>
        dispatch(
          setFrozenCount.create({ viewId, count: isFrozenHere ? 0 : count }),
        ),
    },
    ...(column.isTitle ? [] : [hide]),
    {
      label: column.isWrapped === true ? TEXT.unwrapText : TEXT.wrapText,
      icon: "wrap",
      onSelect: () => dispatch(toggleWrapped.create({ viewId, propertyId })),
    },
  ];
}
