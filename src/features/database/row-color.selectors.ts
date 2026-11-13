// The color a row takes from its view's conditional color rules, as
// Notion's: the first rule whose filter keeps the row gives its color; a
// rule with no condition colors nothing.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { ColorRule } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { isFilterGroup, matchesGroup } from "./filter-match.ts";
import { operatorOf } from "./filter-operators.ts";
import {
  TITLE_PROPERTY_ID,
  titleProperty,
  type TableModel,
  type TableRow,
} from "./table-model.selectors.ts";

export interface RowColor {
  readonly color: ColorRule["color"];
  readonly target: ColorRule["target"];
  // Set when the rule colors only its own property's cell in a table.
  readonly propertyId?: string;
}

// The property a rule's first condition tests.
function conditionProperty(rule: ColorRule): string | undefined {
  const first = rule.filter.items[0];
  return first !== undefined && "propertyId" in first
    ? first.propertyId
    : undefined;
}

// A rule colors only once each of its conditions has the value it asks
// for: a blank one lets every row through a filter, but colors none, as
// Notion's.
function isComplete(
  rule: ColorRule,
  properties: readonly PropertyDefinition[],
  state?: AppState,
): boolean {
  return (
    rule.filter.items.length > 0 &&
    rule.filter.items.every((item) => {
      if (isFilterGroup(item)) return true;
      const property = properties.find((each) => each.id === item.propertyId);
      const operator = operatorOf(property, item.operator, state);
      const value = typeof item.value === "string" ? item.value.trim() : "";
      return operator?.needsOperand !== true || value !== "";
    })
  );
}

export function selectRowColorRule(
  model: TableModel,
  row: TableRow,
  state?: AppState,
): RowColor | undefined {
  const rules = model.view.colorRules ?? [];
  if (rules.length === 0) return undefined;
  const title = titleProperty();
  const context = {
    properties: [
      ...(title === undefined ? [] : [title]),
      ...model.database.props.properties,
    ],
    titleId: TITLE_PROPERTY_ID,
    today: model.today ?? "",
    weekStartsOn: model.view.calendar.weekStartsOn,
    state,
  };
  const rule = rules.find(
    (item) =>
      isComplete(item, context.properties, state) &&
      matchesGroup(row, item.filter, context),
  );
  if (rule === undefined) return undefined;
  const propertyId =
    rule.applyTo === "property" ? conditionProperty(rule) : undefined;
  return {
    color: rule.color,
    target: rule.target,
    ...(propertyId !== undefined && { propertyId }),
  };
}

function drawn(found: RowColor | undefined): string | undefined {
  if (found === undefined || found.color === "default") return undefined;
  return found.target === "text" ? `${found.color}-text` : found.color;
}

// The color drawn on the row: "red" for a background, "red-text" for its
// title's text; nothing for the default color.
export function selectRowColor(
  model: TableModel,
  row: TableRow,
  state?: AppState,
): string | undefined {
  return drawn(selectRowColorRule(model, row, state));
}

// A table's row: not colored when its rule colors one property alone.
export function selectTableRowColor(
  model: TableModel,
  row: TableRow,
  state?: AppState,
): string | undefined {
  const found = selectRowColorRule(model, row, state);
  return found?.propertyId === undefined ? drawn(found) : undefined;
}

// A table's cell, colored when its row's rule colors its property alone,
// as Notion's "Apply to › This property".
export function selectCellColor(
  cell: {
    readonly model: TableModel;
    readonly row: TableRow;
    readonly propertyId: string;
  },
  state?: AppState,
): string | undefined {
  const found = selectRowColorRule(cell.model, cell.row, state);
  return found?.propertyId === cell.propertyId ? drawn(found) : undefined;
}
