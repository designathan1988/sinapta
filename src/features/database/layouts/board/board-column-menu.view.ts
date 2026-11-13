// The menu of a board's column, as Notion's group menu: the option's name,
// Hide, Delete and its colors; then moving it left or right among the
// shown columns, the keyboard's way to do what dragging does. Its anchor
// names the board and the column, as two boards may share column keys.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderMenu, type MenuEntry } from "../../../../ui/menu/index.ts";
import { setGroupOrder } from "../../group.commands.ts";
import { groupMenuParts } from "../../group-menu-entries.ts";
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

function moveItems(context: TableContext, place: ColumnPlace): MenuEntry[] {
  const { key, index, shown, keys } = place;
  const viewId = context.model.view.id;
  const move = (offset: number) => (): void => {
    const target = shown[index + offset];
    if (target === undefined) return;
    const order = swapped(keys, key, target.key);
    context.dispatch(setGroupOrder.create({ viewId, order }));
  };
  return [
    { kind: "divider" },
    {
      label: COPY.database.moveLeft,
      icon: "arrow-left",
      onSelect: move(-1),
      isDisabled: index === 0,
    },
    {
      label: COPY.database.moveRight,
      icon: "arrow-right",
      onSelect: move(1),
      isDisabled: index === shown.length - 1,
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
  const parts = groupMenuParts(context, key);
  return renderMenu({
    label: COPY.database.groupActions(column.label),
    ...parts,
    items: [...parts.items, ...moveItems(context, { key, index, shown, keys })],
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
