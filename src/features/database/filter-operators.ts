// The filter conditions a property offers: its type's own, or ones its
// type builds from the property's settings, as a rollup's are built from
// the conditions of the property it reads (Any, None, Every of each).
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { AppState } from "../../state/index.ts";
import type { FilterOperator } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";

export function operatorsOf(
  property: PropertyDefinition | undefined,
  state?: AppState,
): readonly FilterOperator[] {
  const type = propertyType(property?.type ?? "text");
  if (property === undefined || type.filterOperatorsFor === undefined) {
    return type.filterOperators;
  }
  return type.filterOperatorsFor(property, state);
}

export function operatorOf(
  property: PropertyDefinition | undefined,
  id: string,
  state?: AppState,
): FilterOperator | undefined {
  return operatorsOf(property, state).find((item) => item.id === id);
}
