// The end of a column's menu, as Notion's: new columns beside it, a copy
// of it, its place and Delete.
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry } from "../../ui/menu/index.ts";
import { removeProperty } from "./database.commands.ts";
import {
  duplicateProperty,
  insertProperty,
  type ColumnTarget,
} from "./property-copy.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";
import { setPropertyOrder } from "./view.commands.ts";

const TEXT = COPY.database;

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

// A copy of the column, its place, which Move left and right change as
// dragging does, and Delete: all but the title's.
function ownItems(
  column: TableColumn,
  context: TableContext,
  target: ColumnTarget,
): MenuEntry[] {
  const { dispatch } = context;
  const { databaseId, propertyId } = target;
  const move = (offset: number) => () => {
    moveColumn(column, offset, context);
  };
  return [
    {
      label: TEXT.duplicateProperty,
      icon: "duplicate",
      onSelect: () => dispatch(duplicateProperty.create(target)),
    },
    { label: TEXT.moveLeft, icon: "arrow-left", onSelect: move(-1) },
    { label: TEXT.moveRight, icon: "arrow-right", onSelect: move(1) },
    {
      label: TEXT.deleteProperty,
      icon: "trash",
      isDanger: true,
      onSelect: () =>
        dispatch(removeProperty.create({ databaseId, propertyId })),
    },
  ];
}

// New columns beside this one, then the column's own actions.
export function placeItems(
  column: TableColumn,
  context: TableContext,
): MenuEntry[] {
  const { model, dispatch } = context;
  const target = {
    databaseId: model.database.id,
    viewId: model.view.id,
    propertyId: column.property.id,
  };
  const insert = (side: "left" | "right") => () =>
    dispatch(insertProperty.create({ ...target, side }));
  return [
    { kind: "divider" },
    { label: TEXT.insertLeft, icon: "insert-left", onSelect: insert("left") },
    {
      label: TEXT.insertRight,
      icon: "insert-right",
      onSelect: insert("right"),
    },
    ...(column.isTitle ? [] : ownItems(column, context, target)),
  ];
}
