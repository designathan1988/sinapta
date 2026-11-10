import { isBlockOfType, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { PAGE_TYPE, type PageBlock } from "./page.schema.ts";

export function selectPage(
  state: AppState,
  pageId: BlockId | null,
): PageBlock | undefined {
  if (pageId === null) return undefined;
  const block = state.workspace.blocks[pageId];
  if (block === undefined) return undefined;
  return isBlockOfType<PageBlock>(block, PAGE_TYPE) ? block : undefined;
}

// The title as plain text; empty for an untitled page.
export function selectPageTitle(page: PageBlock): string {
  return page.props.title.map((span) => span.text).join("");
}

// The chain of pages from the top level down to the given page.
export function selectBreadcrumbs(
  state: AppState,
  pageId: BlockId | null,
): PageBlock[] {
  const trail: PageBlock[] = [];
  let page = selectPage(state, pageId);
  while (page !== undefined && !trail.includes(page)) {
    trail.unshift(page);
    page = selectPage(state, page.parentId);
  }
  return trail;
}

function allPages(state: AppState): PageBlock[] {
  return Object.values(state.workspace.blocks).flatMap((block) =>
    isBlockOfType<PageBlock>(block, PAGE_TYPE) ? [block] : [],
  );
}

function byTitle(a: PageBlock, b: PageBlock): number {
  return (
    selectPageTitle(a).localeCompare(selectPageTitle(b)) ||
    a.id.localeCompare(b.id)
  );
}

// True when the page or any page above it is in the trash.
export function selectIsInTrash(state: AppState, page: PageBlock): boolean {
  return selectBreadcrumbs(state, page.id).some(
    (ancestor) => ancestor.props.isTrashed,
  );
}

export function selectFavoritePages(state: AppState): PageBlock[] {
  return allPages(state)
    .filter((page) => page.props.isFavorite && !selectIsInTrash(state, page))
    .sort(byTitle);
}

export function selectTrashedPages(state: AppState): PageBlock[] {
  return allPages(state)
    .filter((page) => page.props.isTrashed)
    .sort(byTitle);
}

// Where a page sits among its siblings, for moving it up or down.
export function selectPagePosition(
  state: AppState,
  page: PageBlock,
): { readonly index: number; readonly count: number } {
  const parent = selectPage(state, page.parentId);
  const siblings =
    parent === undefined ? state.workspace.rootIds : parent.childIds;
  return { index: siblings.indexOf(page.id), count: siblings.length };
}
