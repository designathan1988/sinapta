// The menu of a board's column: moving it left or right among the shown
// columns, and hiding it. Its anchor names the board and the column, as
// two boards on one page may share column keys.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../../../ui/menu/index.ts";
import { setGroupOrder, toggleGroupHidden } from "../../group.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { selectBoard, type BoardColumn } from "./board.selectors.ts";

export const BOARD_COLUMN_OVERLAY = "board-column";

const SEPARATOR = "|";

export function boardColumnAnchor(holderId: string, key: string): string {
  return `${holderId}${SEPARATOR}${key}`;
}

// The keys with two of them swapped.
function swapped(keys: readonly string[], a: string, b: string): string[] {
  return keys.map((key) => (key === a ? b : key === b ? a : key));
}

interface ColumnPlace {
  readonly key: string;
  readonly index: number;
  readonly shown: readonly BoardColumn[];
  readonly keys: readonly string[];
}

function columnItems(context: TableContext, place: ColumnPlace): MenuItem[] {
  const { key, index, shown, keys } = place;
  const viewId = context.model.view.id;
  const move = (offset: number) => (): void => {
    const target = shown[index + offset];
    if (target === undefined) return;
    const order = swapped(keys, key, target.key);
    context.dispatch(setGroupOrder.create({ viewId, order }));
  };
  return [
    {
      label: COPY.database.moveLeft,
      onSelect: move(-1),
      isDisabled: index === 0,
    },
    {
      label: COPY.database.moveRight,
      onSelect: move(1),
      isDisabled: index === shown.length - 1,
    },
    {
      label: COPY.database.hideGroup,
      onSelect: () =>
        context.dispatch(toggleGroupHidden.create({ viewId, key })),
    },
  ];
}

export function renderBoardColumnMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const prefix = boardColumnAnchor(model.holderId, "");
  const anchor = state.ui.overlay?.anchorId ?? "";
  const board = selectBoard(model);
  if (!anchor.startsWith(prefix) || board === undefined) return nothing;
  const key = anchor.slice(prefix.length);
  const shown = board.columns.filter((column) => !column.isHidden);
  const index = shown.findIndex((column) => column.key === key);
  const column = shown[index];
  if (column === undefined) return nothing;
  const keys = board.columns.map((item) => item.key);
  return renderMenu({
    label: column.label,
    items: columnItems(context, { key, index, shown, keys }),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
