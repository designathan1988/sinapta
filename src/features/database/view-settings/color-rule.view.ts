// One conditional color rule, as Notion's: a head with the property's
// name, its condition and Delete; the value the condition compares with;
// "Page background" with its color, chosen from ten swatches; and in a
// table "Apply to", the whole row or the rule's own property.
import "./color-rule.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { TONES, type ColorRule, type Filter } from "../../../model/index.ts";
import { closeChildOverlay } from "../../../state/index.ts";
import { renderButton } from "../../../ui/button/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { focusOverlayAnchor } from "../../../ui/overlay/index.ts";
import { renderSelect, type SelectContext } from "../../../ui/select/index.ts";
import {
  deleteColorRule,
  setColorRule,
  type ColorRulePatch,
} from "../color-rules.commands.ts";
import { updateAt } from "../filter-edit.ts";
import { changedFilter, filterProperties } from "../filter-fields.ts";
import { isFilterGroup } from "../filter-match.ts";
import { renderFilterOperand } from "../filter-operand.view.ts";
import { operatorsOf } from "../filter-operators.ts";
import { renderRuleHead } from "../filter-rule-head.view.ts";
import type { FieldChange } from "../filter-row.view.ts";
import type { TableContext } from "../table-cell.view.ts";

const TEXT = COPY.database;
const COLORS = ["default", ...TONES] as const;

function patcher(context: TableContext, rule: ColorRule) {
  return (patch: ColorRulePatch): void => {
    const viewId = context.model.view.id;
    context.dispatch(setColorRule.create({ viewId, ruleId: rule.id, patch }));
  };
}

function renderSwatches(context: TableContext, rule: ColorRule) {
  const set = patcher(context, rule);
  return html`<div class="view-settings__swatches" role="group">
    ${COLORS.map(
      (color) =>
        html`<button
          type="button"
          class="view-settings__swatch"
          data-color=${color}
          aria-label=${COPY.tones[color]}
          title=${COPY.tones[color]}
          aria-pressed=${String(color === rule.color)}
          @click=${() => {
            set({ color });
            // The grid closes; the panel stays, as Notion's.
            focusOverlayAnchor();
            context.dispatch(closeChildOverlay.create({}));
          }}
        ></button>`,
    )}
  </div>`;
}

// A card's color is its background on a board or a gallery; elsewhere, the
// page's, as Notion's.
function backgroundLabel(context: TableContext): string {
  const { type } = context.model.view;
  return type === "board" || type === "gallery"
    ? TEXT.cardBackground
    : TEXT.pageBackground;
}

function renderColorRow(
  context: TableContext,
  rule: ColorRule,
  select: SelectContext,
): TemplateResult {
  return renderSelect(
    {
      id: `color-rule-${rule.id}-color`,
      label: backgroundLabel(context),
      value: rule.color,
      variant: "row",
      options: [],
      onChoose: () => undefined,
      display: html`<span
          class="view-settings__swatch"
          data-color=${rule.color}
        ></span
        >${COPY.tones[rule.color]}`,
      menu: { lead: renderSwatches(context, rule), items: [] },
    },
    select,
  );
}

function renderApplyRow(
  context: TableContext,
  rule: ColorRule,
  select: SelectContext,
): TemplateResult | typeof nothing {
  if (context.model.view.type !== "table") return nothing;
  const set = patcher(context, rule);
  return renderSelect(
    {
      id: `color-rule-${rule.id}-apply`,
      label: TEXT.applyTo,
      value: rule.applyTo ?? "row",
      variant: "row",
      options: (["row", "property"] as const).map((value) => ({
        value,
        label: TEXT.applyTargets[value],
      })),
      onChoose: (value) => {
        set({ applyTo: value === "property" ? "property" : "row" });
      },
    },
    select,
  );
}

function renderDelete(context: TableContext, rule: ColorRule): TemplateResult {
  const viewId = context.model.view.id;
  return renderButton({
    label: TEXT.deleteColorRule,
    icon: "trash",
    isIconOnly: true,
    onClick: () =>
      context.dispatch(deleteColorRule.create({ viewId, ruleId: rule.id })),
  });
}

function renderCondition(
  context: TableContext,
  rule: ColorRule,
  condition: Filter,
): TemplateResult {
  const select = {
    overlay: context.state.ui.overlay,
    dispatch: context.dispatch,
  };
  const property = filterProperties(context).find(
    (item) => item.id === condition.propertyId,
  );
  const operators = operatorsOf(property, context.state);
  const operator = operators.find((item) => item.id === condition.operator);
  const change = (next: FieldChange): void => {
    const filter = updateAt(rule.filter, [0], (item) =>
      changedFilter(item, next, context),
    );
    patcher(context, rule)({ filter });
  };
  const trailing = renderDelete(context, rule);
  const head = { id: `color-rule-${rule.id}`, filter: condition, property };
  const noop = (): void => undefined;
  const operand = {
    filter: condition,
    path: [0],
    property,
    operator,
    placeholder: TEXT.colorValuePlaceholder,
  };
  return html`${renderRuleHead(
    { ...head, operators, change, remove: noop, toAdvanced: noop, trailing },
    select,
  )}
  ${
    operator?.needsOperand === true
      ? renderFilterOperand({ ...operand, onChange: change }, context)
      : nothing
  }`;
}

// A typed value colors as it is typed, as the filter's does.
function onInput(context: TableContext, rule: ColorRule) {
  return (event: Event): void => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (field.dataset.field !== "value") return;
    const filter = updateAt(rule.filter, [0], (item) =>
      changedFilter(item, { field: "value", value: field.value }, context),
    );
    patcher(context, rule)({ filter });
  };
}

export function renderColorRule(
  context: TableContext,
  rule: ColorRule,
): TemplateResult {
  const select = {
    overlay: context.state.ui.overlay,
    dispatch: context.dispatch,
  };
  const condition = rule.filter.items[0];
  return html`<section
    class="view-settings__rule"
    @input=${onInput(context, rule)}
  >
    ${
      condition === undefined || isFilterGroup(condition)
        ? nothing
        : renderCondition(context, rule, condition)
    }
    ${renderColorRow(context, rule, select)}
    ${renderApplyRow(context, rule, select)}
  </section>`;
}
