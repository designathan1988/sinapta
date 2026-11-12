// One rule of a simple filter, opened from its pill as Notion's: the
// property's name, the operator to choose and a button that deletes the
// rule, then the value the rule compares with.
import "./filter-rule.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { Filter, FilterGroup } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { removeAt, updateAt } from "./filter-edit.ts";
import { changedFilter, filterProperties } from "./filter-fields.ts";
import { isFilterGroup } from "./filter-match.ts";
import { renderFilterOperand } from "./filter-operand.view.ts";
import { ruleIndexOf } from "./filter-rule-anchor.ts";
import type { FieldChange } from "./filter-row.view.ts";
import type { FilterOperator } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setViewFilter } from "./view.commands.ts";

interface OpenRule {
  readonly index: number;
  readonly rule: Filter;
}

function openRule(context: TableContext): OpenRule | undefined {
  const { model, state } = context;
  const index = ruleIndexOf(state.ui.overlay?.anchorId, model.holderId);
  const rule = index === undefined ? undefined : model.view.filter.items[index];
  if (index === undefined || rule === undefined || isFilterGroup(rule))
    return undefined;
  return { index, rule };
}

function actions(context: TableContext, index: number) {
  const { model, dispatch } = context;
  const top = model.view.filter;
  const set = (filter: FilterGroup): void => {
    dispatch(setViewFilter.create({ viewId: model.view.id, filter }));
  };
  return {
    change: (change: FieldChange): void => {
      set(
        updateAt(top, [index], (item) => changedFilter(item, change, context)),
      );
    },
    remove: (): void => {
      set(removeAt(top, [index]));
      dispatch(closeOverlay.create({}));
    },
    // A typed value is kept when its field is left, as in the editor.
    onChange: (event: Event): void => {
      const field = event.target;
      if (field instanceof HTMLInputElement)
        set(
          updateAt(top, [index], (item) =>
            changedFilter(
              item,
              { field: "value", value: field.value },
              context,
            ),
          ),
        );
    },
    onKeyDown: (event: KeyboardEvent): void => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    },
  };
}

interface RuleParts {
  readonly index: number;
  readonly operators: readonly FilterOperator[];
  readonly operator: FilterOperator | undefined;
  readonly change: (change: FieldChange) => void;
}

function renderOperatorChoice(
  parts: RuleParts,
  context: TableContext,
): TemplateResult {
  const { index, operators, operator, change } = parts;
  return renderSelect(
    {
      id: `filter-rule-${String(index)}-operator`,
      label: COPY.database.filterOperator,
      value: operator?.id,
      options: operators.map((item) => ({ value: item.id, label: item.label })),
      variant: "quiet",
      onChoose: (value) => {
        change({ field: "operator", value });
      },
    },
    { overlay: context.state.ui.overlay, dispatch: context.dispatch },
  );
}

export function renderFilterRule(
  context: TableContext,
): TemplateResult | typeof nothing {
  const open = openRule(context);
  if (open === undefined) return nothing;
  const { index, rule } = open;
  const property = filterProperties(context).find(
    (item) => item.id === rule.propertyId,
  );
  const operators = propertyType(property?.type ?? "text").filterOperators;
  const operator = operators.find((item) => item.id === rule.operator);
  const { change, remove, onChange, onKeyDown } = actions(context, index);
  const operand = { filter: rule, path: [index], property, operator };
  return html`<div
    class="database__popover database__rule"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @change=${onChange}
    @keydown=${onKeyDown}
  >
    <div class="database__rule-head">
      <span class="database__rule-name">${property?.name ?? ""}</span>
      ${renderOperatorChoice({ index, operators, operator, change }, context)}
      <span class="database__spacer"></span>
      ${renderButton({
        label: COPY.database.removeFilter,
        icon: "trash",
        isIconOnly: true,
        onClick: remove,
      })}
    </div>
    ${
      operator?.needsOperand === true
        ? renderFilterOperand({ ...operand, onChange: change }, context)
        : nothing
    }
  </div>`;
}
