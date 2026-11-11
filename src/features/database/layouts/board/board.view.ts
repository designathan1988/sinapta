// A board: one column per option of the group property. Cards move
// between columns by drag, or by Alt with Left or Right.
import "./board.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import type { BlockId } from "../../../../model/index.ts";
import { announce } from "../../../../ui/announcer/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { startPointerDrag } from "../../../../ui/drag/index.ts";
import { whenConnected } from "../../../../ui/focus/index.ts";
import { addRow, setRowValue } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { renderRowCard } from "../row-card/index.ts";
import {
  selectBoard,
  selectCardMove,
  type BoardColumn,
  type BoardModel,
} from "./board.selectors.ts";

// A long column shows its first cards; the count says how many there are.
const CARD_LIMIT = 100;

interface BoardContext extends TableContext {
  readonly board: BoardModel;
}

function columnName(board: BoardModel, column: BoardColumn): string {
  return (
    column.option?.name ?? `${COPY.database.noValue} ${board.property.name}`
  );
}

interface CardMove {
  readonly rowId: BlockId;
  readonly optionId: string | null;
}

// Focus follows the card into its new column, so the keys keep moving it.
function focusCard(rowId: BlockId): void {
  const selector = `.board [data-row-id="${rowId}"]`;
  const card = document.querySelector(selector);
  if (card === null) return;
  whenConnected(card, () => {
    document.querySelector<HTMLElement>(selector)?.focus();
  });
}

function moveCard(context: BoardContext, move: CardMove): void {
  const { board, dispatch } = context;
  const { rowId, optionId } = move;
  const value = optionId ?? undefined;
  dispatch(setRowValue.create({ rowId, propertyId: board.property.id, value }));
  const column = board.columns.find((item) => item.optionId === optionId);
  if (column !== undefined)
    announce(`${COPY.database.cardMoved} ${columnName(board, column)}`);
  focusCard(rowId);
}

const KEY_OFFSETS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
};

function onCardKey(
  event: KeyboardEvent,
  context: BoardContext,
  rowId: BlockId,
): void {
  const offset = KEY_OFFSETS[event.key];
  if (!event.altKey || offset === undefined) return;
  event.preventDefault();
  const optionId = selectCardMove(context.board.columns, rowId, offset);
  if (optionId !== undefined) moveCard(context, { rowId, optionId });
}

function startCardDrag(event: PointerEvent, context: BoardContext): void {
  startPointerDrag(event, {
    itemSelector: ".row-card, .board__column",
    onDrop(source, target) {
      const rowId = context.model.rows.find(
        (row) => row.id === source.dataset.rowId,
      )?.id;
      const column = target.closest<HTMLElement>(".board__column");
      if (rowId === undefined || column === null) return;
      const optionId = column.dataset.optionId;
      moveCard(context, {
        rowId,
        optionId: optionId === "" ? null : (optionId ?? null),
      });
    },
  });
}

function renderCards(
  context: BoardContext,
  column: BoardColumn,
): TemplateResult {
  const { model, dispatch, board } = context;
  const shown = column.rows.slice(0, CARD_LIMIT);
  const hidden = column.rows.length - shown.length;
  const card = (row: TableRow): TemplateResult =>
    html`<li>
      ${renderRowCard({
        row,
        columns: model.columns,
        dispatch,
        omit: board.property.id,
        cell: selectCellContext(context.state),
        description: COPY.database.moveCardHint,
        onKeyDown: (event) => {
          onCardKey(event, context, row.id);
        },
      })}
    </li>`;
  return html`<ul class="board__cards">
      ${repeat(shown, (row) => row.id, card)}
    </ul>
    ${
      hidden > 0
        ? html`<p class="board__more">+${hidden} ${COPY.database.moreCards}</p>`
        : nothing
    }`;
}

function renderColumn(
  context: BoardContext,
  column: BoardColumn,
): TemplateResult {
  const { model, dispatch, board } = context;
  const name = columnName(board, column);
  const values =
    column.optionId === null ? {} : { [board.property.id]: column.optionId };
  const databaseId = model.database.id;
  return html`<section
    class="board__column"
    data-option-id=${column.optionId ?? ""}
    data-color=${column.option?.color ?? "gray"}
    aria-label=${name}
  >
    <header class="board__header">
      <span class="database__chip" data-color=${column.option?.color ?? "gray"}
        >${name}</span
      >
      <span class="board__count">${column.rows.length}</span>
    </header>
    ${renderCards(context, column)}
    ${renderButton({
      label: COPY.database.newCard,
      icon: "plus",
      onClick: () =>
        dispatch(addRow.create({ databaseId, values, opensPage: true })),
    })}
  </section>`;
}

export function renderBoard(context: TableContext): TemplateResult {
  const board = selectBoard(context.model);
  if (board === undefined) {
    return html`<p class="board__empty">${COPY.database.noGroupProperty}</p>`;
  }
  const boardContext = { ...context, board };
  return html`<div
    class="board"
    @pointerdown=${(event: PointerEvent) => {
      startCardDrag(event, boardContext);
    }}
  >
    ${board.columns.map((column) => renderColumn(boardContext, column))}
  </div>`;
}
