// The menu of one column, as Notion's: the property's name in a field,
// then its settings, filter and sorts, how the table shows it, its place,
// and Delete; and the menu of property types to add.
import { html, nothing, type TemplateResult } from "lit-html";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderMenu,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import {
  addProperty,
  changeProperty,
  removeProperty,
} from "./database.commands.ts";
import { addFilter } from "./filter-edit.ts";
import { firstOperator } from "./filter-fields.ts";
import { PROPERTY_EDIT_OVERLAY } from "./property-edit.view.ts";
import { PROPERTY_TYPES } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setFrozenCount, toggleWrapped } from "./table-layout.commands.ts";
import type { TableColumn } from "./table-model.selectors.ts";
import { FILTERS_OVERLAY } from "./view-filters.view.ts";
import {
  setPropertyOrder,
  setViewFilter,
  sortByProperty,
  togglePropertyHidden,
} from "./view.commands.ts";

function moveColumn(
  column: TableColumn,
  offset: number,
  context: TableContext,
): void {
  const { model, dispatch } = context;
  const order = model.columns
    .filter((item) => !item.isTitle)
    .map((item) => item.property.id);
  const from = order.indexOf(column.property.id);
  const to = from + offset;
  if (from === -1 || to < 0 || to >= order.length) return;
  const propertyOrder = order
    .toSpliced(from, 1)
    .toSpliced(to, 0, column.property.id);
  dispatch(setPropertyOrder.create({ viewId: model.view.id, propertyOrder }));
}

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
  const { database: copy } = COPY;
  const hasOtherSort = view.sorts.some((one) => one.propertyId !== propertyId);
  const then = [
    item(copy.thenAscending, "ascending", true),
    item(copy.thenDescending, "descending", true),
  ];
  const clear = {
    label: copy.clearSort,
    icon: "close" as const,
    onSelect: sort(null, true),
  };
  return [
    item(copy.sortAscending, "ascending"),
    item(copy.sortDescending, "descending"),
    ...(hasOtherSort ? then : []),
    ...(column.sortDirection === undefined ? [] : [clear]),
  ];
}

// Adds a condition on this column and opens the view's filter.
function filterItem(column: TableColumn, context: TableContext): MenuItem {
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
  return { label: COPY.database.filter, icon: "filter", onSelect };
}

// How the table shows the column: frozen with the ones before it, its
// text wrapped, and for properties hidden in this view.
function showItems(column: TableColumn, context: TableContext): MenuItem[] {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const propertyId = column.property.id;
  const count = model.columns.indexOf(column) + 1;
  const isFrozenHere = model.view.frozenCount === count;
  const hide = {
    label: COPY.database.hide,
    icon: "eye-off" as const,
    onSelect: () =>
      dispatch(togglePropertyHidden.create({ viewId, propertyId })),
  };
  return [
    {
      label: isFrozenHere
        ? COPY.database.unfreezeColumns
        : COPY.database.freezeColumns,
      icon: "freeze",
      onSelect: () =>
        dispatch(
          setFrozenCount.create({ viewId, count: isFrozenHere ? 0 : count }),
        ),
    },
    ...(column.isTitle ? [] : [hide]),
    {
      label:
        column.isWrapped === true
          ? COPY.database.unwrapText
          : COPY.database.wrapText,
      icon: "wrap",
      onSelect: () => dispatch(toggleWrapped.create({ viewId, propertyId })),
    },
  ];
}

// Moving and deleting apply to every column but the title.
function placeItems(column: TableColumn, context: TableContext): MenuEntry[] {
  const { model, dispatch } = context;
  const databaseId = model.database.id;
  const propertyId = column.property.id;
  const move = (offset: number) => () => {
    moveColumn(column, offset, context);
  };
  return [
    { kind: "divider" },
    { label: COPY.database.moveLeft, icon: "arrow-left", onSelect: move(-1) },
    { label: COPY.database.moveRight, icon: "arrow-right", onSelect: move(1) },
    { kind: "divider" },
    {
      label: COPY.database.deleteProperty,
      icon: "trash",
      isDanger: true,
      onSelect: () =>
        dispatch(removeProperty.create({ databaseId, propertyId })),
    },
  ];
}

function renderName(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const databaseId = context.model.database.id;
  const propertyId = column.property.id;
  const rename = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const name = event.target.value.trim();
    if (name === "") event.target.value = column.property.name;
    else
      context.dispatch(changeProperty.create({ databaseId, propertyId, name }));
  };
  return html`<label class="menu__field">
    <input
      type="text"
      aria-label=${COPY.database.propertyName}
      .value=${column.property.name}
      @change=${rename}
    />
  </label>`;
}

export function renderColumnMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { state, model, dispatch } = context;
  const anchorId = state.ui.overlay?.anchorId;
  const column = model.columns.find((item) => item.property.id === anchorId);
  if (column === undefined) return nothing;
  const overlay = { kind: PROPERTY_EDIT_OVERLAY, anchorId: column.property.id };
  const edit: MenuEntry[] = [
    {
      label: COPY.database.editProperty,
      icon: "settings",
      onSelect: () => dispatch(openOverlay.create({ overlay })),
    },
    { kind: "divider" },
  ];
  return renderMenu({
    label: COPY.database.columnActions,
    ...(column.isTitle ? {} : { lead: renderName(column, context) }),
    items: [
      ...(column.isTitle ? [] : edit),
      filterItem(column, context),
      ...sortItems(column, context),
      ...showItems(column, context),
      ...(column.isTitle ? [] : placeItems(column, context)),
    ],
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

export function renderTypeMenu(context: TableContext): TemplateResult {
  const databaseId = context.model.database.id;
  const items = PROPERTY_TYPES.map((type) => ({
    label: type.label,
    icon: type.icon,
    onSelect: () =>
      context.dispatch(
        addProperty.create({
          databaseId,
          propertyType: type.type,
          name: type.label,
        }),
      ),
  }));
  return renderMenu({
    label: COPY.database.addProperty,
    items,
    onClose: () => context.dispatch(closeOverlay.create({})),
  });
}
