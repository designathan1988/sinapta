// How cards move on a board: by drag, or from the keyboard with Alt and
// an arrow. Left and Right take a card to the next column, where the
// property lets rows move between its groups; Up and Down move it among
// its column's cards, where the view keeps the database's own order.
import type { BlockId } from "../../../../model/index.ts";
import { announce } from "../../../../ui/announcer/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { startPointerDrag } from "../../../../ui/drag/index.ts";
import { whenConnected } from "../../../../ui/focus/index.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { moveCard } from "./board-card.commands.ts";
import {
  selectCardMove,
  type BoardLanes,
  type BoardModel,
} from "./board.selectors.ts";

export interface BoardContext extends TableContext {
  readonly board: BoardModel;
  // The board's lanes, when the view sub-groups.
  readonly lanes?: BoardLanes;
}

// Focus follows the card to its new place, so the keys keep moving it.
function focusCard(rowId: BlockId): void {
  const selector = `.board [data-row-id="${rowId}"]`;
  const card = document.querySelector(selector);
  if (card === null) return;
  whenConnected(card, () => {
    document.querySelector<HTMLElement>(selector)?.focus();
  });
}

// The row after this one in the view's order: where a card stays put.
function rowAfter(context: BoardContext, rowId: BlockId): BlockId | null {
  const { rows } = context.model;
  const index = rows.findIndex((row) => row.id === rowId);
  return rows[index + 1]?.id ?? null;
}

function keepsOrder(context: BoardContext): boolean {
  return context.model.view.sorts.length === 0;
}

interface Move {
  readonly rowId: BlockId;
  readonly key: string;
  readonly beforeRowId: BlockId | null;
  // The lane it goes to, on a board with lanes.
  readonly laneKey?: string;
}

// The lane's value for a card that changes lanes; null when it stays.
function laneChangeOf(context: BoardContext, target: Move) {
  const { lanes } = context;
  if (lanes === undefined || target.laneKey === undefined) return null;
  const from = lanes.lanes.find((lane) =>
    lane.rows.some((row) => row.id === target.rowId),
  );
  if (from?.key === target.laneKey || lanes.valueFor === undefined) return null;
  return {
    propertyId: lanes.property.id,
    value: lanes.valueFor(target.laneKey),
  };
}

function move(context: BoardContext, target: Move): void {
  const { board, dispatch } = context;
  const { rowId, key } = target;
  const from = board.columns.find((column) =>
    column.rows.some((row) => row.id === rowId),
  );
  const column = board.columns.find((item) => item.key === key);
  if (from === undefined || column === undefined) return;
  const isOther = from.key !== key;
  if (isOther && board.valueFor === undefined) return;
  const beforeRowId = keepsOrder(context)
    ? target.beforeRowId
    : rowAfter(context, rowId);
  const change = isOther
    ? { propertyId: board.property.id, value: board.valueFor?.(key) }
    : null;
  const laneChange = laneChangeOf(context, target);
  dispatch(moveCard.create({ rowId, beforeRowId, change, laneChange }));
  if (isOther) announce(`${COPY.database.cardMoved} ${column.label}`);
  focusCard(rowId);
}

// Up goes before the card above; Down goes after the card below.
function moveWithin(context: BoardContext, rowId: BlockId, step: number) {
  const column = context.board.columns.find((item) =>
    item.rows.some((row) => row.id === rowId),
  );
  const rows = column?.rows ?? [];
  const index = rows.findIndex((row) => row.id === rowId);
  const neighbor = rows[index + step];
  if (column === undefined || neighbor === undefined || !keepsOrder(context))
    return;
  const beforeRowId = step < 0 ? neighbor.id : rowAfter(context, neighbor.id);
  move(context, { rowId, key: column.key, beforeRowId });
}

const ACROSS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
};
const WITHIN: Readonly<Record<string, number>> = { ArrowUp: -1, ArrowDown: 1 };

export function onCardKey(
  event: KeyboardEvent,
  context: BoardContext,
  rowId: BlockId,
): void {
  const across = ACROSS[event.key];
  const within = WITHIN[event.key];
  if (!event.altKey || (across === undefined && within === undefined)) return;
  event.preventDefault();
  if (within !== undefined) {
    moveWithin(context, rowId, within);
    return;
  }
  const key = selectCardMove(context.board.columns, rowId, across ?? 0);
  if (key !== undefined) {
    move(context, { rowId, key, beforeRowId: rowAfter(context, rowId) });
  }
}

export function startCardDrag(event: PointerEvent, context: BoardContext) {
  startPointerDrag(event, {
    itemSelector: ".row-card, .board__column",
    onDrop(source, target, position) {
      const rowId = context.model.rows.find(
        (row) => row.id === source.dataset.rowId,
      )?.id;
      const key =
        target.closest<HTMLElement>(".board__column")?.dataset.groupKey;
      const laneKey =
        target.closest<HTMLElement>(".board__lane")?.dataset.laneKey;
      if (rowId === undefined || key === undefined) return;
      const onto = context.model.rows.find(
        (row) => row.id === target.dataset.rowId,
      )?.id;
      const beforeRowId =
        onto === undefined
          ? null
          : position === "after"
            ? rowAfter(context, onto)
            : onto;
      move(context, {
        rowId,
        key,
        beforeRowId,
        ...(laneKey !== undefined && { laneKey }),
      });
    },
  });
}
