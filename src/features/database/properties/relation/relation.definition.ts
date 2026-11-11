// A relation links a row to rows of another database (or its own). The
// cell shows the related pages' titles; pages in the trash are hidden.
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../../../ui/copy.ts";
import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type CellContext,
  type PropertyType,
} from "../../property-definition.ts";
import { renderRelationConfig } from "./relation-config.view.ts";
import { readRelation } from "./relation-values.ts";
import { RELATION_TYPE } from "./relation.commands.ts";
import { relationConfigSchema } from "./relation.schema.ts";

// The titles of the related pages that are shown, in order.
function shownTitles(value: unknown, cell?: CellContext): string[] {
  const ids = readRelation(value) ?? [];
  return ids.flatMap((id) => {
    const title = cell?.titleOf?.(id);
    if (title === undefined) return [];
    return [title === "" ? COPY.sidebar.untitled : title];
  });
}

function renderRelationCell(
  value: unknown,
  cell?: CellContext,
): TemplateResult | string {
  const titles = shownTitles(value, cell);
  if (titles.length === 0) return "";
  return html`<span class="files">
    ${titles.map((title) => html`<span class="relation__page">${title}</span>`)}
  </span>`;
}

export const relationProperty: PropertyType = {
  type: RELATION_TYPE,
  label: "Relation",
  editor: "relation",
  read: readRelation,
  // Related pages are chosen in their own editor, never typed.
  parse: (_text, previous) => readRelation(previous),
  format: (value, _property, cell) => shownTitles(value, cell).join(", "),
  compare: (a, b) =>
    (readRelation(a)?.length ?? 0) - (readRelation(b)?.length ?? 0),
  filterOperators: [IS_EMPTY, IS_NOT_EMPTY],
  renderCell: (value, _property, cell) => renderRelationCell(value, cell),
  configSchema: relationConfigSchema,
  renderConfigEditor: renderRelationConfig,
};
