// A Markdown file imported as a page, as Notion's import does: named as
// the file, its blocks each of their kind, nested as their indent says,
// at the top level, and opened; an archive's subpages inside their
// pages, after their blocks. One step to undo.
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import type { PastedBlock } from "../../ui/rich-text/index.ts";
import { pastedBlockProps } from "../editor/index.ts";
import type { ImportedPage } from "./archive-pages.ts";

interface Nesting {
  readonly children: Map<BlockId, BlockId[]>;
  readonly parents: Map<BlockId, BlockId>;
}

// Each block's parent: the last block one level up, or the page.
function nest(
  pageId: BlockId,
  blocks: readonly PastedBlock[],
  ids: readonly BlockId[],
): Nesting {
  const children = new Map<BlockId, BlockId[]>([[pageId, []]]);
  const parents = new Map<BlockId, BlockId>();
  const path: BlockId[] = [];
  blocks.forEach((block, index) => {
    const id = ids[index];
    if (id === undefined) return;
    const depth = Math.min(block.depth, path.length);
    const parentId = depth === 0 ? pageId : (path[depth - 1] ?? pageId);
    children.set(parentId, [...(children.get(parentId) ?? []), id]);
    parents.set(id, parentId);
    path.length = depth;
    path.push(id);
  });
  return { children, parents };
}

interface PageMeta {
  readonly childIds: BlockId[];
  readonly parentId: BlockId | null;
  readonly now: string;
}

function pageRecord(id: BlockId, title: string, meta: PageMeta): Block {
  const trimmed = title.trim();
  const { childIds, parentId } = meta;
  return {
    ...{ id, type: PAGE_TYPE, parentId, childIds },
    props: {
      title: trimmed === "" ? [] : [{ text: trimmed }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
    },
    ...{ createdAt: meta.now, updatedAt: meta.now },
  };
}

function blockRecords(
  blocks: readonly PastedBlock[],
  ids: readonly BlockId[],
  placed: Nesting & { readonly now: string },
): Block[] {
  const { children, parents, now } = placed;
  return blocks.flatMap((block, index): Block[] => {
    const id = ids[index];
    const parentId = id === undefined ? undefined : parents.get(id);
    if (id === undefined || parentId === undefined) return [];
    const childIds = children.get(id) ?? [];
    const props = pastedBlockProps(block);
    const times = { createdAt: now, updatedAt: now };
    return [{ id, type: block.kind, parentId, childIds, props, ...times }];
  });
}

// The ids a page takes: its own, its blocks', and its subpages'.
function idsNeeded(page: ImportedPage): number {
  const subpages = page.subpages ?? [];
  return subpages.reduce(
    (sum, subpage) => sum + idsNeeded(subpage),
    1 + page.blocks.length,
  );
}

interface Place {
  readonly parentId: BlockId | null;
  readonly now: string;
}

// A page's records, its subpages' after its blocks, from its share of
// the new ids: its own first, then its blocks', then each subpage's.
function pageRecords(
  page: ImportedPage,
  ids: readonly BlockId[],
  place: Place,
): Block[] {
  const [pageId, ...rest] = ids;
  if (pageId === undefined) return [];
  const blockIds = rest.slice(0, page.blocks.length);
  const subpages: Block[][] = [];
  let at = page.blocks.length;
  for (const subpage of page.subpages ?? []) {
    const share = rest.slice(at, at + idsNeeded(subpage));
    const parent = { parentId: pageId, now: place.now };
    subpages.push(pageRecords(subpage, share, parent));
    at += share.length;
  }
  const nesting = nest(pageId, page.blocks, blockIds);
  const childIds = [
    ...(nesting.children.get(pageId) ?? []),
    ...subpages.flatMap((records) => records[0]?.id ?? []),
  ];
  const { now, parentId } = place;
  return [
    pageRecord(pageId, page.title, { childIds, parentId, now }),
    ...blockRecords(page.blocks, blockIds, { ...nesting, now }),
    ...subpages.flat(),
  ];
}

export const importMarkdown = defineCommand<ImportedPage>({
  type: "page.importMarkdown",
  newIds: (payload) => ({ blocks: idsNeeded(payload) }),
  handle(state, command) {
    const { now, blockIds } = command.meta;
    const records = pageRecords(command, blockIds, { parentId: null, now });
    const pageId = records[0]?.id;
    if (pageId === undefined) return {};
    const index = siblingIds(state.workspace, null).length;
    const operations: Operation[] = [
      ...records.map((record): Operation => ({
        type: "record.create",
        kind: "block",
        record,
      })),
      { type: "list.insert", list: listOf(null), id: pageId, index },
    ];
    return {
      operations,
      ui: { ...state.ui, activePageId: pageId, peek: null, overlay: null },
    };
  },
});

export const markdownImportCommands = [importMarkdown];
