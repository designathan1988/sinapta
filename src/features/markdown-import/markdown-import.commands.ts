// A Markdown file imported as a page, as Notion's import does: named as
// the file, its blocks each of their kind, nested as their indent says,
// at the top level, and opened; one step to undo.
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

function pageRecord(
  id: BlockId,
  title: string,
  meta: { readonly childIds: BlockId[]; readonly now: string },
): Block {
  const trimmed = title.trim();
  return {
    ...{ id, type: PAGE_TYPE, parentId: null, childIds: meta.childIds },
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

export const importMarkdown = defineCommand<{
  title: string;
  blocks: readonly PastedBlock[];
}>({
  type: "page.importMarkdown",
  newIds: (payload) => ({ blocks: 1 + payload.blocks.length }),
  handle(state, command) {
    const [pageId, ...ids] = command.meta.blockIds;
    if (pageId === undefined) return {};
    const { now } = command.meta;
    const nesting = nest(pageId, command.blocks, ids);
    const childIds = nesting.children.get(pageId) ?? [];
    const page = pageRecord(pageId, command.title, { childIds, now });
    const records = blockRecords(command.blocks, ids, { ...nesting, now });
    const index = siblingIds(state.workspace, null).length;
    const operations: Operation[] = [
      ...[page, ...records].map((record): Operation => ({
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
