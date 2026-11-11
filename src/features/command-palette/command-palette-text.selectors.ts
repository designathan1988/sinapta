// Pages found by the text of their blocks, for the palette's search. Each
// result shows the words around the first match on the page.
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import {
  isPageLike,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { Block } from "../../model/index.ts";
import { setActivePage, type AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

export interface TextMatch {
  readonly label: string;
  readonly detail: string;
  readonly command: ReturnType<typeof setActivePage.create>;
}

const BEFORE = 12;
const AFTER = 48;

// Comparison that ignores case and width forms in any language.
export function foldQuery(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

// The text of a page's own blocks, without the pages nested inside it.
function pageText(state: AppState, block: Block): string[] {
  return block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    if (child === undefined || isPageLike(child)) return [];
    const own = isTextBlock(child) ? [textOf(child)] : [];
    return [...own, ...pageText(state, child)];
  });
}

// The words around a match, cut at word starts, with an ellipsis where
// text was left out.
function snippet(text: string, index: number, length: number): string {
  let start = Math.max(0, index - BEFORE);
  if (start > 0 && text[start - 1] !== " ")
    start = text.indexOf(" ", start) + 1 || index;
  const end = Math.min(text.length, index + length + AFTER);
  const head = start > 0 ? "…" : "";
  const tail = end < text.length ? "…" : "";
  return `${head}${text.slice(start, end)}${tail}`;
}

function matchIn(page: PageBlock, lines: readonly string[], needle: string) {
  for (const line of lines) {
    const index = foldQuery(line).indexOf(needle);
    if (index === -1) continue;
    const title = selectPageTitle(page);
    const label = `${page.props.icon ?? ""} ${title === "" ? COPY.sidebar.untitled : title}`;
    return {
      label: label.trim(),
      detail: snippet(line, index, needle.length),
      command: setActivePage.create({ pageId: page.id }),
    };
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
    const match = matchIn(block, pageText(state, block), needle);
    if (match !== undefined) matches.push(match);
  }
  return matches;
}
