// A page and its subpages as files, as Notion exports them: the page's
// Markdown, and beside it a folder of the same name holding its
// subpages' files and folders. Names that meet in a folder are numbered.
import {
  isPageLike,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import {
  markdownFileName,
  selectPageMarkdown,
} from "./markdown-export.selectors.ts";

export interface ArchiveFile {
  readonly path: string;
  readonly text: string;
}

// The pages inside a page, wherever they sit among its blocks.
export function selectSubpages(state: AppState, pageId: BlockId): PageBlock[] {
  const inside = (ids: readonly BlockId[]): PageBlock[] =>
    ids.flatMap((id) => {
      const block = state.workspace.blocks[id];
      if (block === undefined) return [];
      if (isPageLike(block)) {
        const page = selectPage(state, id);
        return page === undefined || page.props.isTrashed ? [] : [page];
      }
      return inside(block.childIds);
    });
  return inside(state.workspace.blocks[pageId]?.childIds ?? []);
}

// A file name not yet taken in the folder: "Sub", then "Sub 2".
function freeName(base: string, taken: Set<string>): string {
  let name = base;
  for (let count = 2; taken.has(name); count += 1)
    name = `${base} ${String(count)}`;
  taken.add(name);
  return name;
}

function pageFiles(
  state: AppState,
  page: PageBlock,
  place: { readonly folder: string; readonly taken: Set<string> },
): ArchiveFile[] {
  const base = markdownFileName(selectPageTitle(page)).replace(/\.md$/, "");
  const name = freeName(base, place.taken);
  const path = `${place.folder}${name}`;
  const inner = { folder: `${path}/`, taken: new Set<string>() };
  return [
    { path: `${path}.md`, text: selectPageMarkdown(state, page.id) },
    ...selectSubpages(state, page.id).flatMap((child) =>
      pageFiles(state, child, inner),
    ),
  ];
}

export function selectPageArchive(
  state: AppState,
  pageId: BlockId,
): ArchiveFile[] {
  const page = selectPage(state, pageId);
  if (page === undefined) return [];
  return pageFiles(state, page, { folder: "", taken: new Set() });
}
