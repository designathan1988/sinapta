// The trash's list, as Notion's: trashed pages found by their title, kept
// to those that were in one page if asked, each with the pages it was in.
import {
  selectBreadcrumbs,
  selectPageTitle,
  selectTrashedPages,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

export interface TrashFilter {
  readonly query: string;
  // The page the listed pages were in, or null for anywhere.
  readonly inId: BlockId | null;
}

export interface TrashRow {
  readonly page: PageBlock;
  readonly title: string;
  // The pages it was in, outermost first.
  readonly path: string;
}

export interface TrashParent {
  readonly id: BlockId;
  readonly title: string;
}

const fold = (text: string): string =>
  text.normalize("NFKC").toLocaleLowerCase("en-US");

function nameOf(page: PageBlock): string {
  const title = selectPageTitle(page);
  return title === "" ? COPY.sidebar.untitled : title;
}

// The pages above a page, outermost first.
function ancestors(state: AppState, page: PageBlock): PageBlock[] {
  return selectBreadcrumbs(state, page.id).slice(0, -1);
}

export function selectTrashRows(
  state: AppState,
  filter: TrashFilter,
): TrashRow[] {
  const needle = fold(filter.query.trim());
  return selectTrashedPages(state).flatMap((page) => {
    const above = ancestors(state, page);
    const title = nameOf(page);
    if (needle !== "" && !fold(title).includes(needle)) return [];
    if (filter.inId !== null && !above.some((item) => item.id === filter.inId))
      return [];
    return [{ page, title, path: above.map(nameOf).join(" / ") }];
  });
}

// The pages trashed pages were in, for the "In" filter.
export function selectTrashParents(state: AppState): TrashParent[] {
  const parents = new Map<BlockId, string>();
  for (const page of selectTrashedPages(state)) {
    const parent = ancestors(state, page).at(-1);
    if (parent !== undefined) parents.set(parent.id, nameOf(parent));
  }
  return [...parents].map(([id, title]) => ({ id, title }));
}
