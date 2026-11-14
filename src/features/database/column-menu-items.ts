// The rows of a column's menu, as Notion's: filter, the Sort and
// Calculate submenus, group, and how the table shows the column.
import { openOverlay, requestSync } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { addFilter } from "./filter-edit.ts";
import { newCondition } from "./filter-fields.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { isGroupable } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setFrozenCount, toggleWrapped } from "./table-layout.commands.ts";
import type { TableColumn } from "./table-model.selectors.ts";
import { openedRule } from "./filter-start.view.ts";
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
  const [up, down] = sortNames(column.property.type);
  return [
    item(up, "ascending"),
    item(down, "descending"),
    ...(hasOtherSort ? then : []),
    ...(column.sortDirection === undefined ? [] : [clear]),
  ];
}

const SORT_KINDS: Readonly<Record<string, keyof typeof TEXT.sortNames>> = {
  title: "text",
  text: "text",
  url: "text",
  email: "text",
  phone: "text",
  date: "date",
  "created-time": "date",
  "edited-time": "date",
  number: "number",
  "unique-id": "number",
  checkbox: "checkbox",
};

// The column's two orders in Notion's words; select and status keep
// ascending and descending.
function sortNames(type: string): readonly [string, string] {
  const kind = SORT_KINDS[type];
  return kind === undefined
    ? [TEXT.sortAscending, TEXT.sortDescending]
    : TEXT.sortNames[kind];
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

// Adds a condition on this column and opens it by its pill, as Notion's;
// in an advanced filter, the filter opens with the others.
export function filterItem(
  column: TableColumn,
  context: TableContext,
): MenuItem {
  const { model, dispatch } = context;
  const onSelect = (): void => {
    const filter = newCondition(column.property, context.state);
    const next = addFilter(model.view.filter, [], filter);
    dispatch(setViewFilter.create({ viewId: model.view.id, filter: next }));
    const overlay = openedRule(model.holderId, next);
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
// Notion's AI autofill, one row after Change type that opens its kinds:
// fills a text property of every row from the row's page, on the server
// (ADR-0013).
export function aiFillItem(
  column: TableColumn,
  context: TableContext,
): MenuItem[] {
  const { property } = column;
  const isSignedIn = context.state.persistence.account.user !== null;
  if (property.type !== "text" || column.isTitle || !isSignedIn) return [];
  const fill = (action: "summarize" | "action-items" | "translate") => () =>
    context.dispatch(
      requestSync.create({
        request: {
          kind: "ai-fill",
          databaseId: context.model.database.id,
          propertyId: property.id,
          action,
        },
      }),
    );
  const kinds = ["summarize", "action-items", "translate"] as const;
  const items = kinds.map((action) => ({
    label: COPY.ai.autofillKinds[action],
    onSelect: fill(action),
  }));
  return [
    {
      label: COPY.ai.autofill,
      icon: "sparkles",
      submenu: {
        id: `${property.id}:ai-fill`,
        menu: () => ({ label: COPY.ai.autofill, items }),
      },
    },
  ];
}

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
