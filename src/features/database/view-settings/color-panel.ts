// The view settings' "Conditional color" panel, as Notion's: a picture of
// colored rows and the note over "New color setting"; each rule a box
// with its color, what it colors, Delete, and its conditions built from
// the filter's own rows.
import { html, type TemplateResult } from "lit-html";
import { TONES, type ColorRule } from "../../../model/index.ts";
import { renderButton } from "../../../ui/button/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderSelect, type SelectContext } from "../../../ui/select/index.ts";
import {
  addColorRule,
  deleteColorRule,
  setColorRule,
  type ColorRulePatch,
} from "../color-rules.commands.ts";
import { addFilter, removeAt, updateAt } from "../filter-edit.ts";
import { changedFilter, newFilter } from "../filter-fields.ts";
import { isFilterGroup } from "../filter-match.ts";
import { renderFilterRow, type FieldChange } from "../filter-row.view.ts";
import type { TableContext } from "../table-cell.view.ts";
import type { SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;
const COLORS = ["default", ...TONES] as const;

function patcher(context: TableContext, rule: ColorRule) {
  return (patch: ColorRulePatch): void => {
    const viewId = context.model.view.id;
    context.dispatch(setColorRule.create({ viewId, ruleId: rule.id, patch }));
  };
}

function renderColorChoice(
  context: TableContext,
  rule: ColorRule,
  select: SelectContext,
): TemplateResult {
  const set = patcher(context, rule);
  return renderSelect(
    {
      id: `color-rule-${rule.id}-color`,
      label: TEXT.colorRuleColor,
      value: rule.color,
      options: COLORS.map((value) => ({
        value,
        label: COPY.tones[value],
        color: value,
      })),
      onChoose: (value) => {
        const found = COLORS.find((item) => item === value);
        if (found !== undefined) set({ color: found });
      },
    },
    select,
  );
}

function renderTargetChoice(
  context: TableContext,
  rule: ColorRule,
  select: SelectContext,
): TemplateResult {
  const set = patcher(context, rule);
  return renderSelect(
    {
      id: `color-rule-${rule.id}-target`,
      label: TEXT.colorTarget,
      value: rule.target,
      variant: "quiet",
      options: (["background", "text"] as const).map((value) => ({
        value,
        label: TEXT.colorTargets[value],
      })),
      onChoose: (value) => {
        set({ target: value === "text" ? "text" : "background" });
      },
    },
    select,
  );
}

function renderRuleHead(
  context: TableContext,
  rule: ColorRule,
  select: SelectContext,
): TemplateResult {
  const viewId = context.model.view.id;
  const remove = renderButton({
    label: TEXT.deleteColorRule,
    icon: "trash",
    isIconOnly: true,
    onClick: () =>
      context.dispatch(deleteColorRule.create({ viewId, ruleId: rule.id })),
  });
  return html`<div class="view-settings__rule-head">
    ${renderColorChoice(context, rule, select)}
    ${renderTargetChoice(context, rule, select)} ${remove}
  </div>`;
}

function changeAt(context: TableContext, rule: ColorRule, index: number) {
  return (change: FieldChange): void => {
    const filter = updateAt(rule.filter, [index], (item) =>
      changedFilter(item, change, context),
    );
    patcher(context, rule)({ filter });
  };
}

function conditionRow(
  context: TableContext,
  rule: ColorRule,
  index: number,
): TemplateResult | undefined {
  const item = rule.filter.items[index];
  if (item === undefined || isFilterGroup(item)) return undefined;
  const lead = html`<span class="database__filter-lead"
    >${index === 0 ? TEXT.filterWhere : TEXT.conjunctionAnd}</span
  >`;
  const onRemove = (): void => {
    patcher(context, rule)({ filter: removeAt(rule.filter, [index]) });
  };
  const props = {
    filter: item,
    path: [index],
    lead,
    onRemove,
    onChange: changeAt(context, rule, index),
    idBase: `color-rule-${rule.id}-${String(index)}`,
  };
  return renderFilterRow(props, context);
}

function renderConditions(context: TableContext, rule: ColorRule) {
  const rows = rule.filter.items.map((_, index) =>
    conditionRow(context, rule, index),
  );
  const add = (): void => {
    const condition = newFilter(context);
    if (condition === undefined) return;
    patcher(context, rule)({ filter: addFilter(rule.filter, [], condition) });
  };
  // A typed value is kept when its field is left.
  const onFieldChange = (event: Event): void => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (field.dataset.field !== "value") return;
    const holder = field.closest<HTMLElement>("[data-path]");
    const index = Number(holder?.dataset.path ?? -1);
    changeAt(context, rule, index)({ field: "value", value: field.value });
  };
  return html`<ul class="database__filters" @change=${onFieldChange}>
      ${rows}
    </ul>
    ${renderButton({ label: TEXT.addColorCondition, icon: "plus", onClick: add })}`;
}

function renderRule(context: TableContext, rule: ColorRule): TemplateResult {
  const select = {
    overlay: context.state.ui.overlay,
    dispatch: context.dispatch,
  };
  return html`<section class="view-settings__rule" data-color=${rule.color}>
    ${renderRuleHead(context, rule, select)} ${renderConditions(context, rule)}
  </section>`;
}

// Notion's picture over the note: a sample table, its rows tinted as
// rules would tint them.
const SAMPLE_COLORS = ["green", "", "green", "orange", "red"];

function renderSampleRow(cells: readonly string[], color: string) {
  return html`<span class="view-settings__color-row" data-color=${color}
    >${cells.map((cell) => html`<span>${cell}</span>`)}</span
  >`;
}

function renderPicture(): TemplateResult {
  const { head, rows } = TEXT.colorSample;
  return html`<div class="view-settings__color-picture" aria-hidden="true">
    <span class="view-settings__color-row" data-head
      >${head.map((cell) => html`<span>${cell}</span>`)}</span
    >
    ${rows.map((cells, index) =>
      renderSampleRow(cells, SAMPLE_COLORS[index] ?? ""),
    )}
  </div>`;
}

function renderLead(context: TableContext): TemplateResult {
  const rules = context.model.view.colorRules ?? [];
  const viewId = context.model.view.id;
  return html`<div class="view-settings__colors">
    ${rules.length === 0 ? renderPicture() : rules.map((rule) => renderRule(context, rule))}
    ${rules.length === 0 ? html`<p class="view-settings__note">${TEXT.conditionalColorNote}</p>` : ""}
    ${renderButton({
      label: TEXT.newColorSetting,
      icon: "plus",
      variant: "primary",
      // A panel without rows: its button takes the keys.
      takesFocus: true,
      onClick: () => context.dispatch(addColorRule.create({ viewId })),
    })}
  </div>`;
}

export function colorPanel(context: TableContext): SettingsPanel {
  return {
    title: TEXT.conditionalColor,
    back: null,
    items: [],
    lead: renderLead(context),
  };
}
