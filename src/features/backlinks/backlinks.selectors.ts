// The pages that link to a page, as Notion's backlinks: each page holding
// a mention of it or a link to it, once, leaving out the trash.
import {
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { isTextBlock } from "../../blocks/index.ts";
import { PAGE_LINK_TYPE } from "../../blocks/page-link/index.ts";
import { mentionsPage, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

export interface Backlink {
  readonly pageId: BlockId;
  readonly title: string;
  readonly icon: string | null;
}

// The blocks that mention the page or link to it, in no set order.
export function selectBacklinks(state: AppState, pageId: BlockId): BlockId[] {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (block.type === PAGE_LINK_TYPE && block.props.pageId === pageId) {
      return [block.id];
    }
    return isTextBlock(block) && mentionsPage(block.props.text, pageId)
      ? [block.id]
      : [];
  });
}

// The page a block is on: the nearest page above it.
function pageOf(state: AppState, blockId: BlockId): PageBlock | undefined {
  let id = state.workspace.blocks[blockId]?.parentId ?? null;
  while (id !== null) {
    const block = state.workspace.blocks[id];
    if (block === undefined) return undefined;
    if (isPageLike(block)) return block;
    id = block.parentId;
  }
  return undefined;
}

export function selectBacklinkPages(
  state: AppState,
  pageId: BlockId,
): Backlink[] {
  const pages = new Map<BlockId, Backlink>();
  for (const blockId of selectBacklinks(state, pageId)) {
    const page = pageOf(state, blockId);
    if (page === undefined || page.id === pageId) continue;
    if (selectIsInTrash(state, page)) continue;
    const title = selectPageTitle(page);
    pages.set(page.id, {
      pageId: page.id,
      title: title === "" ? COPY.sidebar.untitled : title,
      icon: page.props.icon,
    });
  }
  return [...pages.values()];
}
