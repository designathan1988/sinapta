// The columns of a board: one per option of the view's group property,
// after a first column for rows with no option, each holding the rows the
// view shows, in the view's order.
import type {
  PropertyDefinition,
  SelectOption,
} from "../../../../blocks/database/index.ts";
import type { BlockId } from "../../../../model/index.ts";
import type { TableModel, TableRow } from "../../table-model.selectors.ts";

export interface BoardColumn {
  // Null for the column of rows with no option.
  readonly optionId: string | null;
  readonly option: SelectOption | undefined;
  readonly rows: readonly TableRow[];
}

export interface BoardModel {
  readonly property: PropertyDefinition;
  readonly columns: readonly BoardColumn[];
}

// The view's group property, or the first select property when the view
// has none yet, such as a board made before the property was added.
export function selectGroupProperty(
  model: TableModel,
): PropertyDefinition | undefined {
  const selects = model.database.props.properties.filter(
    (property) => property.type === "select",
  );
  const id = model.view.groupPropertyId;
  return selects.find((property) => property.id === id) ?? selects[0];
}

export function selectBoard(model: TableModel): BoardModel | undefined {
  const property = selectGroupProperty(model);
  if (property === undefined) return undefined;
  const options = property.options ?? [];
  const known = new Set(options.map((option) => option.id));
  const optionOf = (row: TableRow): string | null => {
    const value = row.values[property.id];
    return typeof value === "string" && known.has(value) ? value : null;
  };
  const columnFor = (option: SelectOption | undefined): BoardColumn => {
    const optionId = option?.id ?? null;
    const rows = model.rows.filter((row) => optionOf(row) === optionId);
    return { optionId, option, rows };
  };
  return {
    property,
    columns: [columnFor(undefined), ...options.map(columnFor)],
  };
}

export function selectBoardColumns(
  model: TableModel,
): readonly BoardColumn[] | undefined {
  return selectBoard(model)?.columns;
}

// The option a card moves to when it goes `offset` columns over: null for
// the column of rows with no option, undefined when there is no column.
export function selectCardMove(
  columns: readonly BoardColumn[],
  rowId: BlockId,
  offset: number,
): string | null | undefined {
  const from = columns.findIndex((column) =>
    column.rows.some((row) => row.id === rowId),
  );
  if (from === -1) return undefined;
  return columns[from + offset]?.optionId;
}
