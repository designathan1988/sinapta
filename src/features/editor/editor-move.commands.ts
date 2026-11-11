// Moving and deleting whole blocks.
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  dropMove,
  isSelfOrInside,
  listOf,
  planMove,
  siblingIds,
  type Block,
  type BlockId,
  type BlockMove,
  type Drop,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { caretAt } from "./editor.commands.ts";
import { selectNeighborTextBlock } from "./editor.selectors.ts";

// Pages and text blocks hold other blocks.
export function canHold(state: AppState, parentId: BlockId | null): boolean {
  const parent =
    parentId === null ? undefined : state.workspace.blocks[parentId];
  return (
    parent !== undefined && (parent.type === PAGE_TYPE || isTextBlock(parent))
  );
}

// Moves a content block to a parent and position. Blocks live inside a
// page or inside a text block, never at the top level.
export const moveBlock = defineCommand<BlockMove>({
  type: "block.move",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined || block.type === PAGE_TYPE) return {};
    if (!canHold(state, command.parentId)) return {};
    return { operations: planMove(state.workspace, command) };
  },
});

// Where dropping one block on another puts it. A block that cannot hold
// others takes the dropped block after itself.
export function selectBlockDrop(
  state: AppState,
  blockId: BlockId,
  drop: Drop,
): BlockMove | undefined {
  const canNest = canHold(state, drop.targetId);
  const position =
    drop.position === "inside" && !canNest ? "after" : drop.position;
  return dropMove(state.workspace, blockId, { ...drop, position });
}

// The blocks that move with their own parent: content blocks outside the
// page, not inside another moved block, in the order given.
function movedTops(
  state: AppState,
  blockIds: readonly BlockId[],
  pageId: BlockId,
): Block[] {
  const { workspace } = state;
  const ids = new Set(blockIds);
  const isInsideMoved = (block: Block): boolean =>
    block.parentId !== null &&
    blockIds.some(
      (id) => id !== block.id && isSelfOrInside(workspace, block.parentId, id),
    );
  return [...ids].flatMap((id) => {
    const block = workspace.blocks[id];
    if (block === undefined || block.type === PAGE_TYPE) return [];
    if (isSelfOrInside(workspace, pageId, id) || isInsideMoved(block))
      return [];
    return [block];
  });
}

// Moves blocks, with everything inside them, to the end of a page. All
// blocks leave their places before any is added, so their order holds.
export const moveBlocksToPage = defineCommand<{
  blockIds: readonly BlockId[];
  pageId: BlockId;
}>({
  type: "block.moveToPage",
  handle(state, command) {
    const { pageId } = command;
    const page = state.workspace.blocks[pageId];
    if (page?.type !== PAGE_TYPE) return {};
    const blocks = movedTops(state, command.blockIds, pageId);
    if (blocks.length === 0) return {};
    const moved = new Set(blocks.map((block) => block.id));
    const end = page.childIds.filter((id) => !moved.has(id)).length;
    const list = listOf(pageId);
    const operations: Operation[] = [
      ...blocks.map((block): Operation => ({
        type: "list.remove",
        list: listOf(block.parentId),
        id: block.id,
      })),
      ...blocks.map((block, index): Operation => ({
        type: "list.insert",
        list,
        id: block.id,
        index: end + index,
      })),
      ...blocks.map((block): Operation => ({
        type: "record.update",
        kind: "block",
        id: block.id,
        patch: { parentId: pageId },
      })),
    ];
    const ui = { ...state.ui, selection: null, blockSelection: null };
    return { operations, ui };
  },
});

// Moves a block one place up (-1) or down (1) among its siblings.
export const moveBlockBy = defineCommand<{ blockId: BlockId; offset: -1 | 1 }>({
  type: "block.moveBy",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined || block.type === PAGE_TYPE) return {};
    const { parentId } = block;
    const index =
      siblingIds(state.workspace, parentId).indexOf(block.id) + command.offset;
    if (index < 0) return {};
    return {
      operations: planMove(state.workspace, {
        blockId: block.id,
        parentId,
        index,
      }),
    };
  },
});

// The operations that delete a block and everything inside it.
export function deleteOperations(state: AppState, block: Block): Operation[] {
  const deletions = subtree(state, block).map((item): Operation => ({
    type: "record.delete",
    kind: "block",
    id: item.id,
  }));
  return [
    { type: "list.remove", list: listOf(block.parentId), id: block.id },
    ...deletions,
  ];
}

function subtree(state: AppState, block: Block): Block[] {
  const children = block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    return child === undefined ? [] : subtree(state, child);
  });
  return [block, ...children];
}

// Deletes a block and everything inside it. The caret goes to the end of
// the text block before it.
export const deleteBlock = defineCommand<{ blockId: BlockId }>({
  type: "block.delete",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined || block.type === PAGE_TYPE) return {};
    const previous = selectNeighborTextBlock(state, block.id, -1);
    const selection =
      previous === undefined
        ? null
        : caretAt(previous.id, textOf(previous).length);
    return {
      operations: deleteOperations(state, block),
      ui: { ...state.ui, selection },
    };
  },
});

export const editorMoveCommands = [
  moveBlock,
  moveBlockBy,
  moveBlocksToPage,
  deleteBlock,
];
