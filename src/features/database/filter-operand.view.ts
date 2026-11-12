// The value a filter rule compares with: one of the options for a select
// property, or the operator's own choices such as a status group, as
// Notion's option lists; free text or a date for the others. A typed
// value is a field whose holder carries the rule's path.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect, type SelectOption } from "../../ui/select/index.ts";
import type { FilterPath } from "./filter-edit.ts";
import type { FilterOperator } from "./property-definition.ts";
import type { TableContext } from "./table-cell.view.ts";

export interface OperandProps {
  readonly filter: Filter;
  readonly path: FilterPath;
  readonly property: PropertyDefinition | undefined;
  readonly operator: FilterOperator | undefined;
  readonly onChange: (change: {
    readonly field: "value";
    readonly value: string;
  }) => void;
}

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

export function renderFilterOperand(
  props: OperandProps,
  context: TableContext,
): TemplateResult {
  const { filter, path, property, onChange } = props;
  const current = typeof filter.value === "string" ? filter.value : "";
  const options = operandOptions(property, props.operator);
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
    type=${property?.type === "date" ? "date" : "text"}
    data-field="value"
    aria-label=${COPY.database.filterValue}
    placeholder=${COPY.database.filterValue}
    .value=${current}
  />`;
}
