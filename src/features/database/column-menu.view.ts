// The menu of one column and the menu of property types to add.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { addProperty, removeProperty } from "./database.commands.ts";
import { PROPERTY_TYPES } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";
import {
  setPropertyOrder,
  setViewSorts,
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

function sortItems(column: TableColumn, context: TableContext): MenuItem[] {
  const viewId = context.model.view.id;
  const propertyId = column.property.id;
  const sort = (direction: "ascending" | "descending") => () =>
    context.dispatch(
      setViewSorts.create({ viewId, sorts: [{ propertyId, direction }] }),
    );
  return [
    {
      label: COPY.database.sortAscending,
      icon: "up",
      onSelect: sort("ascending"),
    },
    {
      label: COPY.database.sortDescending,
      icon: "down",
      onSelect: sort("descending"),
    },
    {
      label: COPY.database.clearSort,
      onSelect: () =>
        context.dispatch(setViewSorts.create({ viewId, sorts: [] })),
    },
  ];
}

// Moving, hiding and deleting apply to every column but the title.
function layoutItems(column: TableColumn, context: TableContext): MenuItem[] {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const propertyId = column.property.id;
  const databaseId = model.database.id;
  return [
    {
      label: COPY.database.moveLeft,
      onSelect() {
        moveColumn(column, -1, context);
      },
    },
    {
      label: COPY.database.moveRight,
      onSelect() {
        moveColumn(column, 1, context);
      },
    },
    {
      label: COPY.database.hide,
      onSelect: () =>
        dispatch(togglePropertyHidden.create({ viewId, propertyId })),
    },
    {
      label: COPY.database.deleteProperty,
      icon: "trash",
      isDanger: true,
      onSelect: () =>
        dispatch(removeProperty.create({ databaseId, propertyId })),
    },
  ];
}

export function renderColumnMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const anchorId = context.state.ui.overlay?.anchorId;
  const column = context.model.columns.find(
    (item) => item.property.id === anchorId,
  );
  if (column === undefined) return nothing;
  const layout = column.isTitle ? [] : layoutItems(column, context);
  return renderMenu({
    label: COPY.database.columnActions,
    items: [...sortItems(column, context), ...layout],
    onClose: () => context.dispatch(closeOverlay.create({})),
  });
}

export function renderTypeMenu(context: TableContext): TemplateResult {
  const databaseId = context.model.database.id;
  const items = PROPERTY_TYPES.map((type) => ({
    label: type.label,
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
