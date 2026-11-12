// What the search shows of a page beside its results, as Notion's: where
// the page is, its icon and title, and the first lines of its text.
import {
  isPageLike,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { pageTexts } from "./command-palette-text.selectors.ts";

const PREVIEW_LINES = 12;

export interface PagePreview {
  readonly title: string;
  readonly icon: string | null;
  readonly path: string;
  readonly lines: readonly string[];
}

export function titleOf(page: PageBlock): string {
  const title = selectPageTitle(page);
  return title === "" ? COPY.sidebar.untitled : title;
}

// The pages a page is in, outermost first: "Projects / Q4".
export function selectPagePath(state: AppState, page: PageBlock): string {
  const names: string[] = [];
  let parentId = page.parentId;
  while (parentId !== null) {
    const parent = state.workspace.blocks[parentId];
    if (parent === undefined) break;
    if (isPageLike(parent)) names.unshift(titleOf(parent));
    parentId = parent.parentId;
  }
  return names.join(" / ");
}

export function selectPagePreview(
  state: AppState,
  pageId: BlockId,
): PagePreview | undefined {
  const page = selectPage(state, pageId);
  if (page === undefined) return undefined;
  const lines = pageTexts(state, page)
    .map((line) => line.text)
    .filter((text) => text.trim() !== "")
    .slice(0, PREVIEW_LINES);
  return {
    title: titleOf(page),
    icon: page.props.icon,
    path: selectPagePath(state, page),
    lines,
  };
}
