// What a filter condition can be built from: the columns it can test and
// a fresh condition on the first of them.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { operatorOf, operatorsOf } from "./filter-operators.ts";
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
  state?: AppState,
): string {
  const type = propertyType(property?.type ?? "text");
  if (type.filterOperatorsFor !== undefined) {
    return operatorsOf(property, state)[0]?.id ?? "";
  }
  return type.defaultFilter ?? type.filterOperators[0]?.id ?? "";
}

// A new condition on a property: its type's first condition, with the
// operand that condition starts with.
export function newCondition(
  property: PropertyDefinition,
  state?: AppState,
): Filter {
  const operator = firstOperator(property, state);
  const value = startingOperand(property, operator, state);
  return { propertyId: property.id, operator, value };
}

export function newFilter(context: TableContext): Filter | undefined {
  const first = filterProperties(context)[0];
  return first === undefined ? undefined : newFilterFor(first, context);
}

// A new condition on a property: its first operator and that operator's
// own starting value.
export function newFilterFor(
  property: PropertyDefinition,
  context: TableContext,
): Filter {
  const operator = firstOperator(property, context.state);
  const value = startingOperand(property, operator, context.state);
  return { propertyId: property.id, operator, value };
}

// The operand a condition starts with: its operator's own, or none.
function startingOperand(
  property: PropertyDefinition | undefined,
  operator: string,
  state?: AppState,
): string {
  return operatorOf(property, operator, state)?.defaultOperand ?? "";
}

// Another operator keeps the operand unless one of the two reads its
// operand its own way, as "Is relative to today" does.
function withOperator(
  filter: Filter,
  operator: string,
  context: TableContext,
): Filter {
  const property = filterProperties(context).find(
    (item) => item.id === filter.propertyId,
  );
  const before = operatorOf(property, filter.operator, context.state);
  const after = operatorOf(property, operator, context.state);
  const isOwn = (item: typeof after) => item?.defaultOperand !== undefined;
  if (!isOwn(before) && !isOwn(after)) return { ...filter, operator };
  return { ...filter, operator, value: after?.defaultOperand ?? "" };
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
  if (field === "operator") return withOperator(filter, value, context);
  if (field === "value") return { ...filter, value };
  if (field === "dateEnd") {
    return { ...filter, dateEnd: value === "end" ? "end" : "start" };
  }
  const property = filterProperties(context).find((item) => item.id === value);
  if (property === undefined) return filter;
  // Another property has other operators and other values.
  return {
    propertyId: property.id,
    operator: firstOperator(property, context.state),
    value: startingOperand(
      property,
      firstOperator(property, context.state),
      context.state,
    ),
  };
}
