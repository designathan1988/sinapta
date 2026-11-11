// A gallery: rows as cards in a grid, each with the first image on its
// page as a cover.
import "./gallery.css";
import { html, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { addRow } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { renderRowCard } from "../row-card/index.ts";
import { selectRowCover } from "./gallery.selectors.ts";

export function renderGallery(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const databaseId = model.database.id;
  return html`<div class="gallery">
    <ul class="gallery__cards">
      ${repeat(
        model.rows,
        (row) => row.id,
        (row) =>
          html`<li>
            ${renderRowCard({
              row,
              columns: model.columns,
              dispatch,
              cover: selectRowCover(state, row.id),
              cell: selectCellContext(state),
            })}
          </li>`,
      )}
      <li>
        ${renderButton({
          label: COPY.database.newCard,
          icon: "plus",
          onClick: () =>
            dispatch(addRow.create({ databaseId, opensPage: true })),
        })}
      </li>
    </ul>
  </div>`;
}
