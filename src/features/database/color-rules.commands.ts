// A view's conditional color rules, as Notion's "Conditional color": each
// rule a filter and a color for the rows it keeps, on their background
// or their title's text. A new rule is red, with no condition yet.
import type { DatabaseBlock } from "../../blocks/database/index.ts";
import type {
  ColorRule,
  FilterGroup,
  FilterItem,
  Operation,
  View,
  ViewId,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";

function patchRules(view: View, colorRules: ColorRule[]): CommandEffect {
  return {
    operations: [
      {
        type: "record.update",
        kind: "view",
        id: view.id,
        patch: { colorRules },
      },
    ],
  };
}

const EMPTY_FILTER: FilterGroup = { conjunction: "and", items: [] };

export const addColorRule = defineCommand<{ viewId: ViewId }>({
  type: "view.addColorRule",
  // A rule's id comes from the ids the dispatcher makes for properties.
  newIds: { properties: 1 },
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const id = command.meta.propertyIds[0];
    if (view === undefined || id === undefined) return {};
    const rule: ColorRule = {
      id,
      filter: EMPTY_FILTER,
      color: "red",
      target: "background",
    };
    return patchRules(view, [...(view.colorRules ?? []), rule]);
  },
});

export type ColorRulePatch = Partial<
  Pick<ColorRule, "filter" | "color" | "target">
>;

export const setColorRule = defineCommand<{
  viewId: ViewId;
  ruleId: string;
  patch: ColorRulePatch;
}>({
  type: "view.setColorRule",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const rules = view?.colorRules ?? [];
    if (view === undefined || !rules.some((rule) => rule.id === command.ruleId))
      return {};
    return patchRules(
      view,
      rules.map((rule) =>
        rule.id === command.ruleId ? { ...rule, ...command.patch } : rule,
      ),
    );
  },
});

export const deleteColorRule = defineCommand<{
  viewId: ViewId;
  ruleId: string;
}>({
  type: "view.deleteColorRule",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    const rules = view?.colorRules ?? [];
    if (view === undefined || !rules.some((rule) => rule.id === command.ruleId))
      return {};
    return patchRules(
      view,
      rules.filter((rule) => rule.id !== command.ruleId),
    );
  },
});

export const colorRuleCommands = [addColorRule, setColorRule, deleteColorRule];

function withoutProperty(filter: FilterGroup, propertyId: string): FilterGroup {
  const items = filter.items.flatMap((item): FilterItem[] => {
    if (!("conjunction" in item))
      return item.propertyId === propertyId ? [] : [item];
    const inner = item.items.filter((each) => each.propertyId !== propertyId);
    return inner.length === 0 ? [] : [{ ...item, items: inner }];
  });
  return { ...filter, items };
}

// When a property goes, the conditions on it leave every color rule of
// the database's views, and a rule left with none goes with them.
export function colorRulesAfterRemoving(
  state: AppState,
  database: DatabaseBlock,
  propertyId: string,
): Operation[] {
  const views = database.props.viewIds.flatMap(
    (id) => state.workspace.views[id] ?? [],
  );
  return views.flatMap((view): Operation[] => {
    const rules = view.colorRules ?? [];
    const kept = rules.flatMap((rule) => {
      const filter = withoutProperty(rule.filter, propertyId);
      const isEmptied =
        filter.items.length === 0 && rule.filter.items.length > 0;
      return isEmptied ? [] : [{ ...rule, filter }];
    });
    const isSame = JSON.stringify(kept) === JSON.stringify(rules);
    if (isSame) return [];
    const patch = { colorRules: kept };
    return [{ type: "record.update", kind: "view", id: view.id, patch }];
  });
}
