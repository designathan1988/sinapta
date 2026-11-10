// Finds which cell of the table an event happened in.
import {
  parseBlockId,
  parsePropertyId,
  type BlockId,
  type PropertyId,
} from "../../model/index.ts";
import { TITLE_KEY, type TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";

export interface CellRef {
  readonly rowId: BlockId;
  readonly propertyId: PropertyId | null;
  readonly key: string;
}

export function cellOf(target: EventTarget | null): CellRef | undefined {
  const element =
    target instanceof Element
      ? target.closest<HTMLElement>("[data-cell]")
      : null;
  const key = element?.dataset.cell ?? "";
  const [row = "", property = ""] = key.split(":");
  const rowId = parseBlockId(row);
  if (rowId === undefined) return undefined;
  const propertyId =
    property === TITLE_KEY ? null : (parsePropertyId(property) ?? null);
  return { rowId, propertyId, key };
}

export function columnOf(
  cell: CellRef,
  context: TableContext,
): TableColumn | undefined {
  return context.model.columns.find((column) =>
    cell.propertyId === null
      ? column.isTitle
      : column.property.id === cell.propertyId,
  );
}
