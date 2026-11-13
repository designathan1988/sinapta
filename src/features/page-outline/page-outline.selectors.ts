// The floating outline of a page, as Notion's: a short dash at the page's
// right edge for each heading, longer for the page's higher levels, shown
// once the page has three headings; and, for a heading inside closed
// toggles, the toggles to open before it can be shown.
import { HEADING_TYPE, type HeadingBlock } from "../../blocks/heading/index.ts";
import { PAGE_LIKE_TYPES } from "../../blocks/page/index.ts";
import {
  selectTableOfContents,
  type TocEntry,
} from "../../blocks/table-of-contents/index.ts";
import { TOGGLE_TYPE, type ToggleBlock } from "../../blocks/toggle/index.ts";
import { isBlockOfType, type Block, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

// Fewer headings than this show no outline.
export const OUTLINE_THRESHOLD = 3;

export type DashSize = "long" | "mid" | "short";

export interface OutlineEntry extends TocEntry {
  readonly dash: DashSize;
}

const SIZES: readonly DashSize[] = ["long", "mid", "short"];

export function selectPageOutline(
  state: AppState,
  pageId: BlockId,
): readonly OutlineEntry[] {
  const headings = selectTableOfContents(state, pageId);
  if (headings.length < OUTLINE_THRESHOLD) return [];
  const levels = [...new Set(headings.map((entry) => entry.level))].sort(
    (a, b) => a - b,
  );
  return headings.map((entry) => ({
    ...entry,
    dash: SIZES[Math.min(levels.indexOf(entry.level), 2)] ?? "short",
  }));
}

export interface ClosedHolder {
  readonly blockId: BlockId;
  readonly isHeading: boolean;
}

// A block that hides what it holds: a closed toggle, or a closed toggle
// heading.
function closedHolder(block: Block): ClosedHolder | undefined {
  if (isBlockOfType<ToggleBlock>(block, TOGGLE_TYPE)) {
    return block.props.isOpen
      ? undefined
      : { blockId: block.id, isHeading: false };
  }
  const isClosedHeading =
    isBlockOfType<HeadingBlock>(block, HEADING_TYPE) &&
    block.props.isToggleable === true &&
    block.props.isOpen === false;
  return isClosedHeading ? { blockId: block.id, isHeading: true } : undefined;
}

// The closed toggles and toggle headings holding a block, outermost
// first, up to its page.
export function selectClosedHolders(
  state: AppState,
  blockId: BlockId,
): readonly ClosedHolder[] {
  const holders: ClosedHolder[] = [];
  let parentId = state.workspace.blocks[blockId]?.parentId ?? null;
  while (parentId !== null) {
    const parent = state.workspace.blocks[parentId];
    if (parent === undefined || PAGE_LIKE_TYPES.includes(parent.type)) break;
    const holder = closedHolder(parent);
    if (holder !== undefined) holders.unshift(holder);
    parentId = parent.parentId;
  }
  return holders;
}
