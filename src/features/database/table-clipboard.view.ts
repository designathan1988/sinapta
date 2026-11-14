// Copy and paste of a table cell, as Notion's: Ctrl+C on a cell (not
// being edited) copies its value as text; Ctrl+V on a cell puts the text
// in it, read as the property's type. Text that does not fit is refused
// and said, as typing it would be.
import { renamePage } from "../../blocks/page/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { propertyType } from "./property-registry.ts";
import { setRowValue } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { cellOf, columnOf, type CellRef } from "./table-cell-ref.ts";

// The cell the event is on, when it is a cell and not its open editor.
function cellAt(event: ClipboardEvent): CellRef | undefined {
  const { target } = event;
  if (target instanceof HTMLInputElement) return undefined;
  if (target instanceof HTMLTextAreaElement) return undefined;
  return cellOf(target);
}

function cellText(cell: CellRef, context: TableContext): string | undefined {
  const row = context.model.rows.find((each) => each.id === cell.rowId);
  const column = columnOf(cell, context);
  if (row === undefined || column === undefined) return undefined;
  if (cell.propertyId === null) return row.title;
  const { property } = column;
  return propertyType(property.type).format(row.values[property.id], property);
}

export function onCellCopy(event: ClipboardEvent, context: TableContext) {
  const cell = cellAt(event);
  const text = cell === undefined ? undefined : cellText(cell, context);
  if (text === undefined || event.clipboardData === null) return;
  event.preventDefault();
  event.clipboardData.setData("text/plain", text);
}

export function onCellPaste(event: ClipboardEvent, context: TableContext) {
  const cell = cellAt(event);
  const text = event.clipboardData?.getData("text/plain");
  if (cell === undefined || text === undefined) return;
  event.preventDefault();
  if (cell.propertyId === null) {
    context.dispatch(renamePage.create({ pageId: cell.rowId, title: text }));
    return;
  }
  const column = columnOf(cell, context);
  if (column === undefined) return;
  const value = propertyType(column.property.type).parse(text);
  if (value === undefined && text.trim() !== "") {
    announce(COPY.database.invalidValue);
    return;
  }
  const { rowId, propertyId } = cell;
  context.dispatch(setRowValue.create({ rowId, propertyId, value }));
}
