// Pages found by the text of their blocks, for the palette's search. Each
// result shows the words around the first match on the page, and opens
// the page at the block that matched.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { isPageLike, type PageBlock } from "../../blocks/page/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { hashForBlock } from "../../ui/address/index.ts";

export interface TextMatch {
  readonly page: PageBlock;
  readonly detail: string;
  // Where the match sits in the detail, to mark it.
  readonly match: { readonly start: number; readonly length: number };
  readonly href: string;
}

interface BlockText {
  readonly blockId: BlockId;
  readonly text: string;
}

const BEFORE = 12;
const AFTER = 48;

// Comparison that ignores case and width forms in any language.
export function foldQuery(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

// The text of a page's own blocks, without the pages nested inside it.
export function pageTexts(state: AppState, block: Block): BlockText[] {
  return block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    if (child === undefined || isPageLike(child)) return [];
    const own = isTextBlock(child)
      ? [{ blockId: id, text: textOf(child) }]
      : [];
    return [...own, ...pageTexts(state, child)];
  });
}

// The words around a match, cut at word starts, with an ellipsis where
// text was left out, and where the match sits in them.
function snippet(text: string, index: number, length: number) {
  let start = Math.max(0, index - BEFORE);
  if (start > 0 && text[start - 1] !== " ")
    start = text.indexOf(" ", start) + 1 || index;
  const end = Math.min(text.length, index + length + AFTER);
  const head = start > 0 ? "…" : "";
  const tail = end < text.length ? "…" : "";
  return {
    detail: `${head}${text.slice(start, end)}${tail}`,
    match: { start: head.length + index - start, length },
  };
}

function matchIn(
  page: PageBlock,
  texts: readonly BlockText[],
  needle: string,
): TextMatch | undefined {
  for (const { blockId, text } of texts) {
    const index = foldQuery(text).indexOf(needle);
    if (index === -1) continue;
    const href = hashForBlock(page.id, blockId);
    return { page, href, ...snippet(text, index, needle.length) };
  }
  return undefined;
}

export function selectTextMatches(
  state: AppState,
  needle: string,
  limit: number,
): TextMatch[] {
  const matches: TextMatch[] = [];
  for (const block of Object.values(state.workspace.blocks)) {
    if (matches.length >= limit) break;
    if (!isPageLike(block) || block.props.isTrashed) continue;
    const match = matchIn(block, pageTexts(state, block), needle);
    if (match !== undefined) matches.push(match);
  }
  return matches;
}
