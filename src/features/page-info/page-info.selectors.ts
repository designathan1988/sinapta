// What the top bar and the page menu say about the open page: when it was
// last edited, and how many words and characters its text has.
import { isPageLike } from "../../blocks/page/index.ts";
import { countText, type WordCount } from "../../blocks/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const TEXT = COPY.pageInfo;
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

// The page and the blocks of its text; subpages are pages of their own.
function pageBlocks(state: AppState, pageId: BlockId): Block[] {
  const page = state.workspace.blocks[pageId];
  if (page === undefined) return [];
  const blocks: Block[] = [page];
  const visit = (block: Block): void => {
    for (const childId of block.childIds) {
      const child = state.workspace.blocks[childId];
      if (child === undefined || isPageLike(child)) continue;
      blocks.push(child);
      visit(child);
    }
  };
  visit(page);
  return blocks;
}

// When the page or a block of its text last changed, in milliseconds.
export function selectPageLastEdit(state: AppState, pageId: BlockId): number {
  const times = pageBlocks(state, pageId).map((b) => Date.parse(b.updatedAt));
  return Math.max(0, ...times);
}

// "Edited just now", "Edited 5m ago", "Edited 3h ago" or "Edited Nov 3".
export function selectEditedLabel(
  state: AppState,
  pageId: BlockId,
  now: string,
): string {
  const edited = selectPageLastEdit(state, pageId);
  const elapsed = Math.max(0, Date.parse(now) - edited);
  if (elapsed < MINUTE_MS) return `${TEXT.edited} ${TEXT.justNow}`;
  if (elapsed < HOUR_MS) {
    return `${TEXT.edited} ${String(Math.floor(elapsed / MINUTE_MS))}${TEXT.minutesAgo}`;
  }
  if (elapsed < DAY_MS) {
    return `${TEXT.edited} ${String(Math.floor(elapsed / HOUR_MS))}${TEXT.hoursAgo}`;
  }
  return `${TEXT.edited} ${DAY_FORMAT.format(edited)}`;
}

export function selectWordCount(state: AppState, pageId: BlockId): WordCount {
  return countText(pageBlocks(state, pageId));
}
