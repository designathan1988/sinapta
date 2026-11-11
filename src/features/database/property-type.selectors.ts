// What changing a property's type needs from the workspace: the options
// its values become.
import type { BlockId, PropertyId } from "../../model/index.ts";
import { selectDatabase } from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import type { AppState } from "../../state/index.ts";
import { optionNamesOf } from "./property-convert.ts";

export interface TypeChange {
  readonly databaseId: BlockId;
  readonly propertyId: PropertyId;
  readonly propertyType: string;
}

export function selectOptionNamesFor(
  state: AppState,
  change: TypeChange,
): string[] {
  const database = selectDatabase(state, change.databaseId);
  const property = database?.props.properties.find(
    (item) => item.id === change.propertyId,
  );
  if (database === undefined || property === undefined) return [];
  const stored = database.childIds.map(
    (rowId) => selectPage(state, rowId)?.props.values?.[property.id],
  );
  return optionNamesOf(property, change.propertyType, stored);
}
