// A gallery: rows as cards in a grid, each with the first image on its
// page as a cover; a grouped gallery shows a grid for each group.
import { withDefaultTemplate } from "../../template-default.commands.ts";
import "./gallery.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { renderGroupSection } from "../../group-section.view.ts";
import { selectRowGroups } from "../../row-groups.selectors.ts";
import { addRow } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import { renderRowCard, selectCardPicture } from "../row-card/index.ts";

// The grid of cards; `adds` ends it with a card that adds a row.
function renderCards(
  rows: readonly TableRow[],
  context: TableContext,
  adds: boolean,
): TemplateResult {
  const { model, state, dispatch } = context;
  return html`<ul class="gallery__cards">
    ${repeat(
      rows,
      (row) => row.id,
      (row) =>
        html`<li>
          ${renderRowCard({
            row,
            viewId: model.view.id,
            columns: model.columns,
            dispatch,
            picture: selectCardPicture(state, row.id, model.view.cardPreview),
            cell: selectCellContext(state),
          })}
        </li>`,
    )}
    ${adds ? renderAddCard(context) : nothing}
  </ul>`;
}

// The last card, which adds a row from the default template.
function renderAddCard(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const payload = {
    databaseId: model.database.id,
    opensPage: true,
    viewId: model.view.id,
  };
  return html`<li>
    ${renderButton({
      label: COPY.database.newCard,
      icon: "plus",
      onClick: () =>
        dispatch(addRow.create(withDefaultTemplate(state, payload))),
    })}
  </li>`;
}

export function renderGallery(context: TableContext): TemplateResult {
  const grouped = selectRowGroups(context.model);
  if (grouped === undefined) {
    return html`<div class="gallery" data-size=${context.model.view.cardSize}>
      ${renderCards(context.model.rows, context, true)}
    </div>`;
  }
  const content = (rows: readonly TableRow[]) =>
    renderCards(rows, context, false);
  return html`<div class="gallery" data-size=${context.model.view.cardSize}>
    ${grouped.groups
      .filter((group) => !group.isHidden)
      .map((group) => renderGroupSection({ grouped, group, content }, context))}
  </div>`;
}
