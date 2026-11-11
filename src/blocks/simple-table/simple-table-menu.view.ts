// The menu of a table cell, opened by a right click or the context menu
// key: rows and columns around the cell, and the headers.
import { nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import {
  insertTableColumn,
  insertTableRow,
  removeTableColumn,
  removeTableRow,
  toggleTableHeader,
} from "./simple-table.commands.ts";
import type { SimpleTableBlock } from "./simple-table.schema.ts";

export const SIMPLE_TABLE_MENU = "simple-table-cell";

// The menu's anchor names the table and the cell: "<id>|<row>|<column>".
export function tableMenuAnchorId(
  blockId: string,
  row: number,
  column: number,
): string {
  return `${blockId}|${String(row)}|${String(column)}`;
}

interface Cell {
  readonly row: number;
  readonly column: number;
}

function openCell(block: SimpleTableBlock, state: AppState): Cell | undefined {
  const { overlay } = state.ui;
  if (overlay?.kind !== SIMPLE_TABLE_MENU) return undefined;
  const [id, row, column] = (overlay.anchorId ?? "").split("|");
  if (id !== block.id) return undefined;
  return { row: Number(row), column: Number(column) };
}

type Label = keyof typeof COPY.simpleTable;
type CellCommand = (blockId: BlockId, cell: Cell) => Command;

// What each item does to the cell's row or column.
const CHANGES: readonly (readonly [Label, CellCommand])[] = [
  [
    "insertRowAbove",
    (blockId, { row }) => insertTableRow.create({ blockId, index: row }),
  ],
  [
    "insertRowBelow",
    (blockId, { row }) => insertTableRow.create({ blockId, index: row + 1 }),
  ],
  [
    "insertColumnLeft",
    (blockId, { column }) =>
      insertTableColumn.create({ blockId, index: column }),
  ],
  [
    "insertColumnRight",
    (blockId, { column }) =>
      insertTableColumn.create({ blockId, index: column + 1 }),
  ],
];

const DELETIONS: readonly (readonly [Label, CellCommand])[] = [
  [
    "deleteRow",
    (blockId, { row }) => removeTableRow.create({ blockId, index: row }),
  ],
  [
    "deleteColumn",
    (blockId, { column }) =>
      removeTableColumn.create({ blockId, index: column }),
  ],
];

function headerItems(block: SimpleTableBlock, dispatch: Dispatch): MenuItem[] {
  const blockId = block.id;
  const header = (axis: "row" | "column", isChecked: boolean): MenuItem => ({
    label:
      axis === "row"
        ? COPY.simpleTable.headerRow
        : COPY.simpleTable.headerColumn,
    check: "box",
    isChecked,
    onSelect: () => dispatch(toggleTableHeader.create({ blockId, axis })),
  });
  return [
    header("row", block.props.hasHeaderRow),
    header("column", block.props.hasHeaderColumn),
  ];
}

function menuItems(
  block: SimpleTableBlock,
  cell: Cell,
  dispatch: Dispatch,
): MenuItem[] {
  const item = ([label, command]: readonly [Label, CellCommand]) => ({
    label: COPY.simpleTable[label],
    onSelect: () => dispatch(command(block.id, cell)),
  });
  const deletion = (entry: readonly [Label, CellCommand]): MenuItem => ({
    ...item(entry),
    icon: "trash",
    isDanger: true,
  });
  return [
    ...CHANGES.map(item),
    ...DELETIONS.map(deletion),
    ...headerItems(block, dispatch),
  ];
}

export function renderTableMenu(
  block: SimpleTableBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const cell = openCell(block, state);
  if (cell === undefined) return nothing;
  const point = state.ui.overlay?.point;
  return renderMenu({
    label: COPY.simpleTable.menu,
    items: menuItems(block, cell, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
    ...(point && { point }),
  });
}
