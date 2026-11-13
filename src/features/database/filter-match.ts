// Whether a row passes a view's filter: an and group passes when all its
// conditions and groups pass, an or group when any does; an empty group
// passes every row. A condition on a property that is gone, with an
// operator its type does not know, or without its value yet, passes too.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import {
  parseBlockId,
  type Filter,
  type FilterGroup,
  type FilterItem,
  type InnerFilterGroup,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { operatorOf } from "./filter-operators.ts";
import { propertyType } from "./property-registry.ts";

export interface RowValues {
  // The row's page, for conditions on values worked out from other rows.
  readonly id?: string;
  readonly title: string;
  readonly values: Readonly<Record<string, unknown>>;
}

export interface MatchContext {
  // The title column first, then the database's properties.
  readonly properties: readonly PropertyDefinition[];
  readonly titleId: string | undefined;
  readonly today: string;
  readonly weekStartsOn?: 0 | 1 | undefined;
  readonly state?: AppState | undefined;
}

// A cell's value as its property's type reads it; the title column reads
// the row's title.
export function cellValue(
  row: RowValues,
  property: PropertyDefinition,
  titleId: string | undefined,
): unknown {
  const stored = property.id === titleId ? row.title : row.values[property.id];
  return propertyType(property.type).read(stored);
}

function matchesFilter(
  row: RowValues,
  filter: Filter,
  context: MatchContext,
): boolean {
  const property = context.properties.find(
    (item) => item.id === filter.propertyId,
  );
  if (property === undefined) return true;
  const operator = operatorOf(property, filter.operator, context.state);
  if (operator === undefined) return true;
  const operand = typeof filter.value === "string" ? filter.value : "";
  // A condition still waiting for its value keeps every row, as in Notion.
  if (operator.needsOperand && operand.trim() === "") return true;
  const value = cellValue(row, property, context.titleId);
  return operator.test(value, operand, {
    property,
    today: context.today,
    weekStartsOn: context.weekStartsOn,
    filter,
    rowId: parseBlockId(row.id ?? "") ?? undefined,
    state: context.state,
  });
}

export function isFilterGroup(item: FilterItem): item is InnerFilterGroup {
  return "conjunction" in item;
}

export function matchesGroup(
  row: RowValues,
  group: FilterGroup | InnerFilterGroup,
  context: MatchContext,
): boolean {
  const passes = (item: FilterItem): boolean =>
    isFilterGroup(item)
      ? matchesGroup(row, item, context)
      : matchesFilter(row, item, context);
  if (group.items.length === 0) return true;
  return group.conjunction === "and"
    ? group.items.every(passes)
    : group.items.some(passes);
}

// How many conditions the filter holds, groups included.
export function filterCount(group: FilterGroup): number {
  return group.items.reduce(
    (sum, item) => sum + (isFilterGroup(item) ? item.items.length : 1),
    0,
  );
}
