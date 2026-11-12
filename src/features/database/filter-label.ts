// The words on a filter rule's pill, as Notion's: the property, then what
// the rule keeps. "Stage: Done" for the property's first operator,
// "Stage: Is not Done" for the others, "Due: Is empty" for an operator
// without a value, and the property alone while the value is missing.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { FilterOperator } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";

function operandLabel(
  filter: Filter,
  property: PropertyDefinition,
  operator: FilterOperator,
): string {
  const operand = typeof filter.value === "string" ? filter.value.trim() : "";
  const choices =
    operator.choices?.(property) ??
    property.options?.map((option) => ({ id: option.id, label: option.name }));
  return choices?.find((choice) => choice.id === operand)?.label ?? operand;
}

export function filterLabel(
  filter: Filter,
  property: PropertyDefinition,
): string {
  const operators = propertyType(property.type).filterOperators;
  const operator = operators.find((item) => item.id === filter.operator);
  if (operator === undefined) return property.name;
  const { rulePill, ruleWithOperator } = COPY.database;
  if (!operator.needsOperand) return rulePill(property.name, operator.label);
  const operand = operandLabel(filter, property, operator);
  if (operand === "") return property.name;
  return operator === operators[0]
    ? rulePill(property.name, operand)
    : rulePill(property.name, ruleWithOperator(operator.label, operand));
}
