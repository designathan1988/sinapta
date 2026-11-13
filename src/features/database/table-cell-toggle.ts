// Turning a checkbox cell on or off from the keyboard, and a status shown
// as a checkbox.
import { isStatusChecked } from "./properties/status/index.ts";
import type { PropertyType } from "./property-definition.ts";
import { setRowValue, setStatusChecked } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { columnOf, type CellRef } from "./table-cell-ref.ts";

// A checkbox cell is not opened: Enter turns it on or off; a status shown
// as a checkbox ticks Complete or To-do.
export function toggleCell(
  cell: CellRef,
  context: TableContext,
  type: PropertyType,
): void {
  if (cell.propertyId === null) return;
  const row = context.model.rows.find((item) => item.id === cell.rowId);
  const property = columnOf(cell, context)?.property;
  if (property?.type === "status") {
    const { rowId, propertyId } = cell;
    const value = type.read(row?.values[propertyId]);
    const checked = !isStatusChecked(property, value);
    context.dispatch(setStatusChecked.create({ rowId, propertyId, checked }));
    return;
  }
  const isChecked = type.read(row?.values[cell.propertyId]) === true;
  context.dispatch(
    setRowValue.create({
      rowId: cell.rowId,
      propertyId: cell.propertyId,
      value: isChecked ? undefined : true,
    }),
  );
}
