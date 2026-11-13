// One rule of a simple filter, opened from its pill as Notion's: a head
// with the property's name, the condition and a "…" menu (Delete filter,
// Add to advanced filter), then the value the rule compares with.
import "./filter-rule.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { Filter, FilterGroup } from "../../model/index.ts";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { removeAt, updateAt } from "./filter-edit.ts";
import { changedFilter, filterProperties } from "./filter-fields.ts";
import { isFilterGroup } from "./filter-match.ts";
import { renderFilterOperand } from "./filter-operand.view.ts";
import { operatorsOf } from "./filter-operators.ts";
import { ruleIndexOf } from "./filter-rule-anchor.ts";
import { renderRuleHead } from "./filter-rule-head.view.ts";
import type { FieldChange } from "./filter-row.view.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setViewFilter } from "./view.commands.ts";
import { VIEW_FILTER_PILL_OVERLAY } from "./view-pills.view.ts";

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

// The rule moves into a group of its own, which makes the filter an
// advanced one, and the advanced filter opens with it, as Notion's.
function moveToAdvanced(context: TableContext, index: number): void {
  const { model, dispatch } = context;
  const top = model.view.filter;
  const items = top.items.map((item, at) =>
    at === index && !isFilterGroup(item)
      ? { conjunction: "and" as const, items: [item] }
      : item,
  );
  const filter = { ...top, items };
  dispatch(setViewFilter.create({ viewId: model.view.id, filter }));
  const overlay = { kind: VIEW_FILTER_PILL_OVERLAY, anchorId: model.holderId };
  dispatch(openOverlay.create({ overlay }));
}

function actions(context: TableContext, index: number) {
  const { model, dispatch } = context;
  const top = model.view.filter;
  const set = (filter: FilterGroup): void => {
    dispatch(setViewFilter.create({ viewId: model.view.id, filter }));
  };
  const change = (next: FieldChange): void => {
    set(updateAt(top, [index], (item) => changedFilter(item, next, context)));
  };
  return {
    change,
    remove: (): void => {
      set(removeAt(top, [index]));
      dispatch(closeOverlay.create({}));
    },
    toAdvanced: (): void => {
      moveToAdvanced(context, index);
    },
    // A typed value is kept when its field is left, as in the editor.
    onChange: (event: Event): void => {
      const field = event.target;
      if (field instanceof HTMLInputElement && field.dataset.field === "value")
        change({ field: "value", value: field.value });
    },
    onKeyDown: (event: KeyboardEvent): void => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    },
  };
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
  const operators = operatorsOf(property, context.state);
  const operator = operators.find((item) => item.id === rule.operator);
  const { change, remove, toAdvanced, onChange, onKeyDown } = actions(
    context,
    index,
  );
  const id = `filter-rule-${String(index)}`;
  const head = { id, filter: rule, property, operators };
  const select = {
    overlay: context.state.ui.overlay,
    dispatch: context.dispatch,
  };
  const operand = { filter: rule, path: [index], property, operator };
  return html`<div
    class="database__popover database__rule"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @change=${onChange}
    @keydown=${onKeyDown}
  >
    ${renderRuleHead({ ...head, change, remove, toAdvanced }, select)}
    ${
      operator?.needsOperand === true
        ? renderFilterOperand({ ...operand, onChange: change }, context)
        : nothing
    }
  </div>`;
}
