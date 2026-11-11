// The filters of a view: one row per condition, each a property, an
// operator and, when the operator needs one, a value to compare with.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import type { FilterOperator, OperandChoice } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { titleProperty } from "./table-model.selectors.ts";
import { setViewFilters } from "./view.commands.ts";

function filterProperties(context: TableContext): PropertyDefinition[] {
  const title = titleProperty();
  const properties = context.model.database.props.properties;
  return title === undefined ? properties : [title, ...properties];
}

function firstOperator(property: PropertyDefinition | undefined): string {
  return propertyType(property?.type ?? "text").filterOperators[0]?.id ?? "";
}

interface Change {
  readonly field: string;
  readonly value: string;
}

// What a change to one control of a filter row turns the filter into.
function changed(
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

function setFilters(context: TableContext, filters: readonly Filter[]): void {
  const viewId = context.model.view.id;
  context.dispatch(setViewFilters.create({ viewId, filters }));
}

// One listener for every control: each names its row and its field.
function onChange(event: Event, context: TableContext): void {
  const control = event.target;
  const isControl =
    control instanceof HTMLSelectElement || control instanceof HTMLInputElement;
  if (!isControl) return;
  const row = control.closest<HTMLElement>("[data-index]");
  const index = Number(row?.dataset.index ?? -1);
  const change = { field: control.dataset.field ?? "", value: control.value };
  const filters = context.model.view.filters.map((filter, position) =>
    position === index ? changed(filter, change, context) : filter,
  );
  setFilters(context, filters);
}

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

function renderFilterRow(
  filter: Filter,
  index: number,
  context: TableContext,
): TemplateResult {
  const properties = filterProperties(context);
  const property = properties.find((item) => item.id === filter.propertyId);
  const operators = propertyType(property?.type ?? "text").filterOperators;
  const operator = operators.find((item) => item.id === filter.operator);
  const remove = (): void => {
    setFilters(
      context,
      context.model.view.filters.filter((_, position) => position !== index),
    );
  };
  return html`<li class="database__filter" data-index=${index}>
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
      onClick: remove,
    })}
  </li>`;
}

export function renderFilters(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const add = (): void => {
    const first = filterProperties(context)[0];
    if (first === undefined) return;
    const filter = {
      propertyId: first.id,
      operator: firstOperator(first),
      value: "",
    };
    setFilters(context, [...model.view.filters, filter]);
  };
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @change=${(event: Event) => {
      onChange(event, context);
    }}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    <ul class="database__filters">
      ${model.view.filters.map((filter, index) => renderFilterRow(filter, index, context))}
    </ul>
    ${renderButton({ label: COPY.database.addFilter, icon: "plus", onClick: add })}
  </div>`;
}
