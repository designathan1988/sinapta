// One condition of a view's filter: a property, an operator and, when the
// operator needs one, a value to compare with. Choices open Notion's
// option lists; typed values are fields. Its row carries its path.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Filter } from "../../model/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { filterProperties } from "./filter-fields.ts";
import {
  offeredConditions,
  renderQuantifierChoice,
} from "./filter-condition.view.ts";
import { renderFilterOperand } from "./filter-operand.view.ts";
import type { FilterPath } from "./filter-edit.ts";
import type { FilterOperator } from "./property-definition.ts";
import { operatorsOf } from "./filter-operators.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";

export interface FieldChange {
  readonly field: "property" | "operator" | "value" | "dateEnd";
  readonly value: string;
}

export interface FilterRowProps {
  readonly filter: Filter;
  readonly path: FilterPath;
  // "Where", or the group's conjunction, before the condition.
  readonly lead: TemplateResult;
  readonly onRemove: () => void;
  readonly onChange: (change: FieldChange) => void;
  // What the condition's controls are named from, when several filters
  // show at once, as a view's color rules; by default its path.
  readonly idBase?: string;
}

function idOf(props: FilterRowProps): string {
  return props.idBase ?? `filter-${props.path.join(".")}`;
}

interface Parts {
  readonly property: PropertyDefinition | undefined;
  readonly operator: FilterOperator | undefined;
}

function renderPropertyChoice(
  props: FilterRowProps,
  property: PropertyDefinition | undefined,
  context: TableContext,
): TemplateResult {
  return renderSelect(
    {
      id: `${idOf(props)}-property`,
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
      id: `${idOf(props)}-operator`,
      label: COPY.database.filterOperator,
      value: parts.operator?.id,
      options: offeredConditions(parts.operators, props.filter.operator).map(
        (item) => ({ value: item.id, label: item.label }),
      ),
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
  const operators = operatorsOf(property, context.state);
  const operator = operators.find((item) => item.id === filter.operator);
  const parts = { property, operator };
  return html`<li class="database__filter" data-path=${path.join(".")}>
    ${lead} ${renderPropertyChoice(props, property, context)}
    ${renderQuantifierChoice(
      {
        id: idOf(props),
        operator: filter.operator,
        onChange: (value) => {
          props.onChange({ field: "operator", value });
        },
      },
      { overlay: context.state.ui.overlay, dispatch: context.dispatch },
    )}
    ${renderOperatorChoice(props, { ...parts, operators }, context)}
    ${
      operator?.needsOperand === true
        ? renderFilterOperand({ ...props, ...parts, isCompact: true }, context)
        : nothing
    }
    ${renderButton({
      label: COPY.database.removeFilter,
      icon: "close",
      isIconOnly: true,
      onClick: onRemove,
    })}
  </li>`;
}
