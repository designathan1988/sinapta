// One condition of a view's filter: a property, an operator and, when the
// operator needs one, a value to compare with. Choices open Notion's
// option lists; typed values are fields. Its row carries its path.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect, type SelectOption } from "../../ui/select/index.ts";
import { filterProperties } from "./filter-fields.ts";
import type { FilterPath } from "./filter-edit.ts";
import type { FilterOperator } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";

export interface FieldChange {
  readonly field: "property" | "operator" | "value";
  readonly value: string;
}

// What a filter's operand is chosen from: the operator's own choices, such
// as a status group, or else the property's options, as chips.
function operandOptions(
  property: PropertyDefinition | undefined,
  operator: FilterOperator | undefined,
): readonly SelectOption[] | undefined {
  if (property === undefined) return undefined;
  if (operator?.choices !== undefined) {
    return operator.choices(property).map((choice) => ({
      value: choice.id,
      label: choice.label,
    }));
  }
  return property.options?.map((option) => ({
    value: option.id,
    label: option.name,
    color: option.color,
  }));
}

export interface FilterRowProps {
  readonly filter: Filter;
  readonly path: FilterPath;
  // "Where", or the group's conjunction, before the condition.
  readonly lead: TemplateResult;
  readonly onRemove: () => void;
  readonly onChange: (change: FieldChange) => void;
}

interface Parts {
  readonly property: PropertyDefinition | undefined;
  readonly operator: FilterOperator | undefined;
}

// The value a filter compares with: one of the options for a select
// property, free text or a date for the others.
function renderOperand(
  props: FilterRowProps,
  parts: Parts,
  context: TableContext,
): TemplateResult {
  const { filter, path, onChange } = props;
  const current = typeof filter.value === "string" ? filter.value : "";
  const options = operandOptions(parts.property, parts.operator);
  if (options !== undefined) {
    return renderSelect(
      {
        id: `filter-${path.join(".")}-value`,
        label: COPY.database.filterValue,
        value: current === "" ? undefined : current,
        options,
        placeholder: COPY.database.filterValue,
        onChoose: (value) => {
          onChange({ field: "value", value });
        },
      },
      { overlay: context.state.ui.overlay, dispatch: context.dispatch },
    );
  }
  return html`<input
    class="database__field"
    type=${parts.property?.type === "date" ? "date" : "text"}
    data-field="value"
    aria-label=${COPY.database.filterValue}
    placeholder=${COPY.database.filterValue}
    .value=${current}
  />`;
}

function renderPropertyChoice(
  props: FilterRowProps,
  property: PropertyDefinition | undefined,
  context: TableContext,
): TemplateResult {
  return renderSelect(
    {
      id: `filter-${props.path.join(".")}-property`,
      label: COPY.database.filterProperty,
      value: property?.id,
      options: filterProperties(context).map((item) => ({
        value: item.id,
        label: item.name,
        icon: propertyType(item.type).icon,
      })),
      searchPlaceholder: COPY.database.searchProperty,
      onChoose: (value) => {
        props.onChange({ field: "property", value });
      },
    },
    { overlay: context.state.ui.overlay, dispatch: context.dispatch },
  );
}

function renderOperatorChoice(
  props: FilterRowProps,
  parts: Parts & { readonly operators: readonly FilterOperator[] },
  context: TableContext,
): TemplateResult {
  return renderSelect(
    {
      id: `filter-${props.path.join(".")}-operator`,
      label: COPY.database.filterOperator,
      value: parts.operator?.id,
      options: parts.operators.map((item) => ({
        value: item.id,
        label: item.label,
      })),
      variant: "quiet",
      onChoose: (value) => {
        props.onChange({ field: "operator", value });
      },
    },
    { overlay: context.state.ui.overlay, dispatch: context.dispatch },
  );
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
  const parts = { property, operator };
  return html`<li class="database__filter" data-path=${path.join(".")}>
    ${lead} ${renderPropertyChoice(props, property, context)}
    ${renderOperatorChoice(props, { ...parts, operators }, context)}
    ${operator?.needsOperand === true ? renderOperand(props, parts, context) : nothing}
    ${renderButton({
      label: COPY.database.removeFilter,
      icon: "close",
      isIconOnly: true,
      onClick: onRemove,
    })}
  </li>`;
}
