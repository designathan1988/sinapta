// Moving and deleting whole blocks.
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  dropMove,
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

function canHold(state: AppState, parentId: BlockId | null): boolean {
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

export const editorMoveCommands = [moveBlock, moveBlockBy, deleteBlock];
