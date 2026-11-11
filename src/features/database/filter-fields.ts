// What a filter condition can be built from: the columns it can test and
// a fresh condition on the first of them.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { titleProperty } from "./table-model.selectors.ts";

// The title column first, then the database's properties.
export function filterProperties(context: TableContext): PropertyDefinition[] {
  const title = titleProperty();
  const properties = context.model.database.props.properties;
  return title === undefined ? properties : [title, ...properties];
}

export function firstOperator(
  property: PropertyDefinition | undefined,
): string {
  return propertyType(property?.type ?? "text").filterOperators[0]?.id ?? "";
}

export function newFilter(context: TableContext): Filter | undefined {
  const first = filterProperties(context)[0];
  if (first === undefined) return undefined;
  return { propertyId: first.id, operator: firstOperator(first), value: "" };
}

interface Change {
  readonly field: string;
  readonly value: string;
}

// What a change to one control of a condition turns it into.
export function changedFilter(
  filter: Filter,
  change: Change,
  context: TableContext,
): Filter {
  const { field, value } = change;
  if (field === "operator") return { ...filter, operator: value };
  if (field === "value") return { ...filter, value };
  const property = filterProperties(context).find((item) => item.id === value);
  if (property === undefined) return filter;
  // Another property has other operators and other values.
  return {
    propertyId: property.id,
    operator: firstOperator(property),
    value: "",
  };
}
