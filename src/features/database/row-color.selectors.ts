// The color a row takes from its view's conditional color rules, as
// Notion's: the first rule whose filter keeps the row gives its color; a
// rule with no condition colors nothing.
import type { ColorRule } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { matchesGroup } from "./filter-match.ts";
import {
  TITLE_PROPERTY_ID,
  titleProperty,
  type TableModel,
  type TableRow,
} from "./table-model.selectors.ts";

export interface RowColor {
  readonly color: ColorRule["color"];
  readonly target: ColorRule["target"];
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
      item.filter.items.length > 0 && matchesGroup(row, item.filter, context),
  );
  return rule === undefined
    ? undefined
    : { color: rule.color, target: rule.target };
}

// The color drawn on the row: "red" for a background, "red-text" for its
// title's text; nothing for the default color.
export function selectRowColor(
  model: TableModel,
  row: TableRow,
  state?: AppState,
): string | undefined {
  const found = selectRowColorRule(model, row, state);
  if (found === undefined || found.color === "default") return undefined;
  return found.target === "text" ? `${found.color}-text` : found.color;
}
