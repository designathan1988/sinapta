// The rows of a view that match its search: the title or a value the view
// shows contains the query, compared without regard to case.
import type { AppState } from "../../state/index.ts";
import { foldText } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import type { TableModel, TableRow } from "./table-model.selectors.ts";

function rowText(row: TableRow, model: TableModel): string {
  const values = model.columns.map(({ property, isTitle }) => {
    if (isTitle) return row.title;
    const type = propertyType(property.type);
    return type.format(type.read(row.values[property.id]), property);
  });
  return foldText(values.join("\n"));
}

export function selectViewSearch(state: AppState, model: TableModel): string {
  return state.ui.viewSearches[model.view.id] ?? "";
}

export function selectSearchedModel(
  state: AppState,
  model: TableModel,
): TableModel {
  const query = foldText(selectViewSearch(state, model).trim());
  if (query === "") return model;
  const rows = model.rows.filter((row) => rowText(row, model).includes(query));
  return { ...model, rows };
}
