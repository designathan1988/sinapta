// One condition of a view's filter: a property, an operator and, when the
// operator needs one, a value to compare with. Its row carries its path.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { filterProperties } from "./filter-fields.ts";
import type { FilterPath } from "./filter-edit.ts";
import type { FilterOperator, OperandChoice } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";

function renderSelect(
  field: string,
  label: string,
  options: TemplateResult[],
): TemplateResult {
  return html`<select
    class="database__field"
    data-field=${field}
    aria-label=${label}
  >
    ${options}
  </select>`;
}

function option(
  value: string,
  label: string,
  isSelected: boolean,
): TemplateResult {
  return html`<option value=${value} ?selected=${isSelected}>${label}</option>`;
}

// What a filter's operand is chosen from: the operator's own choices, such
// as a status group, or else the property's options.
function operandChoices(
  property: PropertyDefinition | undefined,
  operator: FilterOperator | undefined,
): readonly OperandChoice[] | undefined {
  if (property === undefined) return undefined;
  if (operator?.choices !== undefined) return operator.choices(property);
  return property.options?.map((item) => ({ id: item.id, label: item.name }));
}

// The value a filter compares with: one of the options for a select
// property, free text or a date for the others.
function renderOperand(
  filter: Filter,
  property: PropertyDefinition | undefined,
  operator: FilterOperator | undefined,
): TemplateResult {
  const current = typeof filter.value === "string" ? filter.value : "";
  const choices = operandChoices(property, operator);
  if (choices !== undefined) {
    const options = choices.map((item) =>
      option(item.id, item.label, item.id === current),
    );
    return renderSelect("value", COPY.database.filterValue, [
      option("", "", current === ""),
      ...options,
    ]);
  }
  return html`<input
    class="database__field"
    type=${property?.type === "date" ? "date" : "text"}
    data-field="value"
    aria-label=${COPY.database.filterValue}
    .value=${current}
  />`;
}

export interface FilterRowProps {
  readonly filter: Filter;
  readonly path: FilterPath;
  // "Where", or the group's conjunction, before the condition.
  readonly lead: TemplateResult;
  readonly onRemove: () => void;
}

export function renderFilterRow(
  props: FilterRowProps,
  context: TableContext,
): TemplateResult {
  const { filter, path, lead, onRemove } = props;
  const properties = filterProperties(context);
  const property = properties.find((item) => item.id === filter.propertyId);
  const operators = propertyType(property?.type ?? "text").filterOperators;
  const operator = operators.find((item) => item.id === filter.operator);
  return html`<li class="database__filter" data-path=${path.join(".")}>
    ${lead}
    ${renderSelect(
      "property",
      COPY.database.filterProperty,
      properties.map((item) =>
        option(item.id, item.name, item.id === property?.id),
      ),
    )}
    ${renderSelect(
      "operator",
      COPY.database.filterOperator,
      operators.map((item) =>
        option(item.id, item.label, item.id === operator?.id),
      ),
    )}
    ${operator?.needsOperand === true ? renderOperand(filter, property, operator) : nothing}
    ${renderButton({
      label: COPY.database.removeFilter,
      icon: "close",
      isIconOnly: true,
      onClick: onRemove,
    })}
  </li>`;
}
