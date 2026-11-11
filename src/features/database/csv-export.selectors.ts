// A view as CSV, as Notion exports one: the columns the view shows, in its
// order, then each row's values as the cells show them as text.
import { writeCsv } from "../../model/index.ts";
import { propertyType } from "./property-registry.ts";
import type { TableModel, TableRow } from "./table-model.selectors.ts";

function rowCells(row: TableRow, model: TableModel): string[] {
  return model.columns.map(({ property, isTitle }) => {
    if (isTitle) return row.title;
    const type = propertyType(property.type);
    return type.format(type.read(row.values[property.id]), property);
  });
}

export function selectViewCsv(model: TableModel): string {
  const header = model.columns.map((column) => column.property.name);
  return writeCsv([header, ...model.rows.map((row) => rowCells(row, model))]);
}
