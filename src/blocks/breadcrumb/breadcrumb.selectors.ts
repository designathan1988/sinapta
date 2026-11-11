import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import {
  isPageLike,
  selectBreadcrumbs,
  selectPageTitle,
} from "../page/index.ts";

export interface TrailItem {
  readonly pageId: BlockId;
  readonly title: string;
  readonly icon: string | null;
}

// The page a block sits in: its nearest page above it.
function pageOf(state: AppState, blockId: BlockId): BlockId | null {
  let parentId = state.workspace.blocks[blockId]?.parentId ?? null;
  while (parentId !== null) {
    const parent = state.workspace.blocks[parentId];
    if (parent === undefined || isPageLike(parent)) return parentId;
    parentId = parent.parentId;
  }
  return null;
}

// The path from the top level to the page the block sits in.
export function selectBlockTrail(
  state: AppState,
  blockId: BlockId,
): TrailItem[] {
  return selectBreadcrumbs(state, pageOf(state, blockId)).map((page) => ({
    pageId: page.id,
    title: selectPageTitle(page),
    icon: page.props.icon,
  }));
}
