// A board: one column per shown group of the view's grouping, then the
// groups it hides. Cards move by drag or by Alt with an arrow; the view
// sizes them and may tint each column with its group's color.
import "./board.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../../../ui/copy.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { startCardDrag } from "./board-cards.view.ts";
import { renderColumn, renderHiddenColumns } from "./board-column.view.ts";
import { selectBoard } from "./board.selectors.ts";

export function renderBoard(context: TableContext): TemplateResult {
  const board = selectBoard(context.model);
  if (board === undefined) {
    return html`<p class="board__empty">${COPY.database.noGroupProperty}</p>`;
  }
  const boardContext = { ...context, board };
  const { view } = context.model;
  return html`<div
    class="board"
    data-size=${view.cardSize}
    ?data-colored=${view.colorColumns}
    @pointerdown=${(event: PointerEvent) => {
      startCardDrag(event, boardContext);
    }}
  >
    ${board.columns
      .filter((column) => !column.isHidden)
      .map((column) => renderColumn(boardContext, column))}
    ${renderHiddenColumns(boardContext)}
  </div>`;
}
