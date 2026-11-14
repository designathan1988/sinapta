import { isPageLike, type PageBlock } from "../../blocks/page/index.ts";
import { isTextBlock, type TextBlock } from "../../blocks/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import { selectIsEditable, type AppState } from "../../state/index.ts";

// The content blocks directly inside a block, in order. Pages inside a
// page belong to the sidebar tree, not to the page's text.
export function selectChildBlocks(state: AppState, parentId: BlockId): Block[] {
  const parent = state.workspace.blocks[parentId];
  return (parent?.childIds ?? []).flatMap((id) => {
    const block = state.workspace.blocks[id];
    return block === undefined || isPageLike(block) ? [] : [block];
  });
}

// What a page shows, in order: its blocks, and its subpages where they sit
// among them as lines that open them. Trashed subpages are left out.
export function selectContentBlocks(
  state: AppState,
  parentId: BlockId,
): Block[] {
  const parent = state.workspace.blocks[parentId];
  return (parent?.childIds ?? []).flatMap((id) => {
    const block = state.workspace.blocks[id];
    if (block === undefined) return [];
    return isPageLike(block) && block.props.isTrashed ? [] : [block];
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

// The blocks of a block selection, in reading order. Empty when nothing
// is selected or the selection names blocks that are gone.
export function selectSelectedBlocks(state: AppState): Block[] {
  const range = state.ui.blockSelection;
  const pageId =
    range === null ? undefined : selectPageIdOf(state, range.anchorId);
  if (range === null || pageId === undefined) return [];
  const order = selectBlockOrder(state, pageId);
  const anchor = order.findIndex((block) => block.id === range.anchorId);
  const focus = order.findIndex((block) => block.id === range.focusId);
  if (anchor === -1 || focus === -1) return [];
  return order.slice(Math.min(anchor, focus), Math.max(anchor, focus) + 1);
}

// A page that reads as text: locked, in the trash, or shared with this
// person to view or comment on only.
export function selectIsPageFrozen(state: AppState, page: PageBlock): boolean {
  return (
    page.props.isLocked === true ||
    page.props.isTrashed ||
    !selectIsEditable(state, page.id)
  );
}
