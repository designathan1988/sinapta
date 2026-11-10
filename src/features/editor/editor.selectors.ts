import { isPageLike } from "../../blocks/page/index.ts";
import { isTextBlock, type TextBlock } from "../../blocks/text-block.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

// The content blocks directly inside a block, in order. Pages inside a
// page belong to the sidebar tree, not to the page's text.
export function selectChildBlocks(state: AppState, parentId: BlockId): Block[] {
  const parent = state.workspace.blocks[parentId];
  return (parent?.childIds ?? []).flatMap((id) => {
    const block = state.workspace.blocks[id];
    return block === undefined || isPageLike(block) ? [] : [block];
  });
}

// Every content block under a block, depth first: the order in which the
// caret walks them.
export function selectBlockOrder(state: AppState, rootId: BlockId): Block[] {
  return selectChildBlocks(state, rootId).flatMap((block) => [
    block,
    ...selectBlockOrder(state, block.id),
  ]);
}

// The page a block belongs to.
export function selectPageIdOf(
  state: AppState,
  blockId: BlockId,
): BlockId | undefined {
  let block = state.workspace.blocks[blockId];
  while (block !== undefined && !isPageLike(block)) {
    block =
      block.parentId === null
        ? undefined
        : state.workspace.blocks[block.parentId];
  }
  return block?.id;
}

// The text block before (-1) or after (1) a block in caret order.
export function selectNeighborTextBlock(
  state: AppState,
  blockId: BlockId,
  offset: -1 | 1,
): TextBlock | undefined {
  const pageId = selectPageIdOf(state, blockId);
  if (pageId === undefined) return undefined;
  const texts = selectBlockOrder(state, pageId).filter(isTextBlock);
  const index = texts.findIndex((block) => block.id === blockId);
  return index === -1 ? undefined : texts[index + offset];
}
