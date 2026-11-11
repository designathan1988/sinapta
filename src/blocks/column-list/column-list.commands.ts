// Making columns: a block dropped beside another makes them two columns,
// or becomes a new column of the list the other is in. Columns left empty
// are tidied away by tidyColumns; resizing is the column's own command.
import {
  isSelfOrInside,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import { COLUMN_TYPE, setShareOps, shareOf } from "../column/index.ts";
import { isPageLike } from "../page/index.ts";
import { createOps, moveOps } from "./column-operations.ts";
import { COLUMN_LIST_TYPE, MAX_COLUMNS } from "./column-list.schema.ts";

export type Side = "left" | "right";

interface Beside {
  readonly block: Block;
  readonly target: Block;
  readonly side: Side;
  readonly ids: readonly BlockId[];
  readonly now: string;
}

const STRUCTURE = new Set([COLUMN_TYPE, COLUMN_LIST_TYPE]);

function blockAt(
  state: AppState,
  id: BlockId | null | undefined,
): Block | undefined {
  return id == null ? undefined : state.workspace.blocks[id];
}

// Only content blocks go into columns, and never into themselves.
function isMovable(state: AppState, block: Block | undefined) {
  return (
    block !== undefined && !isPageLike(block) && !STRUCTURE.has(block.type)
  );
}

// A new column for the block next to the target's column, the other
// columns giving up a share of their width to it.
function addColumnOps(state: AppState, beside: Beside, column: Block) {
  const list = blockAt(state, column.parentId);
  const [newId] = beside.ids;
  if (list === undefined || newId === undefined) return undefined;
  const count = list.childIds.length;
  if (count >= MAX_COLUMNS) return undefined;
  const columns = list.childIds.flatMap(
    (id) => state.workspace.blocks[id] ?? [],
  );
  const scale = count / (count + 1);
  const index =
    list.childIds.indexOf(column.id) + (beside.side === "right" ? 1 : 0);
  const spec = {
    id: newId,
    type: COLUMN_TYPE,
    props: { ratio: 1 / (count + 1) },
    now: beside.now,
  };
  return [
    ...columns.flatMap((each) =>
      setShareOps(each, shareOf(each, count) * scale),
    ),
    ...createOps(spec, { parentId: list.id, index }),
    ...moveOps(beside.block, { parentId: newId, index: 0 }),
  ];
}

// A new list in the target's place, the target and the block each in a
// column of their own, half the width each.
function wrapOps(state: AppState, beside: Beside): Operation[] | undefined {
  const { target, now } = beside;
  const [listId, firstId, secondId] = beside.ids;
  const parentId = target.parentId;
  if (parentId === null || listId === undefined) return undefined;
  if (firstId === undefined || secondId === undefined) return undefined;
  const index = siblingIds(state.workspace, parentId).indexOf(target.id);
  const column = (id: BlockId) => ({
    id,
    type: COLUMN_TYPE,
    props: { ratio: 0.5 },
    now,
  });
  const [left, right] =
    beside.side === "right" ? [target, beside.block] : [beside.block, target];
  return [
    ...createOps(
      { id: listId, type: COLUMN_LIST_TYPE, props: {}, now },
      { parentId, index },
    ),
    ...createOps(column(firstId), { parentId: listId, index: 0 }),
    ...createOps(column(secondId), { parentId: listId, index: 1 }),
    ...moveOps(left, { parentId: firstId, index: 0 }),
    ...moveOps(right, { parentId: secondId, index: 0 }),
  ];
}

function besideOps(state: AppState, beside: Beside): CommandEffect {
  const { block, target } = beside;
  if (!isMovable(state, block) || !isMovable(state, target)) return {};
  if (isSelfOrInside(state.workspace, target.id, block.id)) return {};
  const parent = blockAt(state, target.parentId);
  const operations =
    parent?.type === COLUMN_TYPE
      ? addColumnOps(state, beside, parent)
      : wrapOps(state, beside);
  return operations === undefined ? {} : { operations };
}

export const dropBeside = defineCommand<{
  blockId: BlockId;
  targetId: BlockId;
  side: Side;
}>({
  type: "columns.dropBeside",
  newBlockIds: 3,
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const target = state.workspace.blocks[command.targetId];
    if (block === undefined || target === undefined) return {};
    const { blockIds: ids, now } = command.meta;
    return besideOps(state, { block, target, side: command.side, ids, now });
  },
});

// The keyboard's way to columns: the block goes into a new column to the
// right of its own column, or beside the block before it.
export const moveToNewColumn = defineCommand<{ blockId: BlockId }>({
  type: "columns.moveToNewColumn",
  newBlockIds: 3,
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block?.parentId == null) return {};
    const { blockIds: ids, now } = command.meta;
    const parent = state.workspace.blocks[block.parentId];
    if (parent?.type === COLUMN_TYPE) {
      const beside = { block, target: block, side: "right" as const, ids, now };
      const operations = addColumnOps(state, beside, parent);
      return operations === undefined ? {} : { operations };
    }
    const siblings = siblingIds(state.workspace, block.parentId);
    const previousId = siblings[siblings.indexOf(block.id) - 1];
    const target =
      previousId === undefined ? undefined : state.workspace.blocks[previousId];
    if (target === undefined) return {};
    return besideOps(state, { block, target, side: "right", ids, now });
  },
});

export const columnListCommands = [dropBeside, moveToNewColumn];
