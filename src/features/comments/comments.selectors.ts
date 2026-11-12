// Where discussions are: the page a block is on, and the open discussions
// about the page or about one of its blocks.
import {
  isPageLike,
  selectPage,
  type Discussion,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

// The page that holds the block, or the block itself when it is a page.
export function selectPageOf(
  state: AppState,
  blockId: BlockId,
): PageBlock | undefined {
  let id: BlockId | null = blockId;
  while (id !== null) {
    const block: Block | undefined = state.workspace.blocks[id];
    if (block === undefined) return undefined;
    if (isPageLike(block)) return selectPage(state, block.id);
    id = block.parentId;
  }
  return undefined;
}

// The open discussions about a block, or about the page itself.
export function selectOpenDiscussions(
  state: AppState,
  target: BlockId,
):
  { readonly page: PageBlock; readonly discussions: Discussion[] } | undefined {
  const page = selectPageOf(state, target);
  if (page === undefined) return undefined;
  const about = page.id === target ? null : target;
  const discussions = (page.props.discussions ?? []).filter(
    (item) => !item.isResolved && item.blockId === about,
  );
  return { page, discussions };
}

// How many open discussions a block inside a page has; the page's own
// are counted at its title, not here.
export function selectBlockDiscussionCount(
  state: AppState,
  blockId: BlockId,
): number {
  const found = selectOpenDiscussions(state, blockId);
  if (found === undefined || found.page.id === blockId) return 0;
  return found.discussions.length;
}

// The page's resolved discussions, oldest first.
export function selectResolvedDiscussions(
  state: AppState,
  pageId: BlockId,
): Discussion[] {
  const page = selectPage(state, pageId);
  return (page?.props.discussions ?? []).filter((item) => item.isResolved);
}

// "Just now", "5m ago", "3h ago", or the day, as Notion dates comments.
export function commentTime(createdAt: string, now: string): string {
  const minutes = Math.floor((Date.parse(now) - Date.parse(createdAt)) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${String(minutes)}m`;
  if (minutes < 24 * 60) return `${String(Math.floor(minutes / 60))}h`;
  return createdAt.slice(0, 10);
}
