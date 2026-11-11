// Duplicating a page: a copy of it and everything inside it, subpages and
// databases with their views included, placed right after it.
import {
  concatRichText,
  copyBlockTree,
  isBlockOfType,
  plainText,
  countBlockTree,
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type View,
  type ViewId,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandMeta,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { DatabaseBlock } from "../database/index.ts";
import { DATABASE_TYPE } from "./page.schema.ts";
import { isPageLike, selectPage } from "./page.selectors.ts";

export interface PageCopySize {
  // Blocks in the page's tree, the page included.
  readonly blockCount: number;
  // Views of the databases in that tree.
  readonly viewCount: number;
}

function viewIdsOf(block: Block): readonly ViewId[] {
  return isBlockOfType<DatabaseBlock>(block, DATABASE_TYPE)
    ? block.props.viewIds
    : [];
}

function treeBlocks(state: AppState, rootId: BlockId): Block[] {
  const root = state.workspace.blocks[rootId];
  if (root === undefined) return [];
  return [root, ...root.childIds.flatMap((id) => treeBlocks(state, id))];
}

// How many new ids a copy of the page needs, so the dispatcher can make
// them before the command runs.
export function selectPageCopySize(
  state: AppState,
  pageId: BlockId,
): PageCopySize {
  const blocks = treeBlocks(state, pageId);
  return {
    blockCount: countBlockTree(state.workspace, pageId),
    viewCount: blocks.flatMap(viewIdsOf).length,
  };
}

interface ViewCopies {
  readonly views: View[];
  // New view id for each copied view's id.
  readonly ids: ReadonlyMap<ViewId, ViewId>;
}

function copyViews(
  state: AppState,
  pairs: readonly (readonly [Block, Block])[],
  newIds: readonly ViewId[],
): ViewCopies {
  const ids = new Map<ViewId, ViewId>();
  const views = pairs.flatMap(([original, copy]) =>
    viewIdsOf(original).flatMap((viewId) => {
      const view = state.workspace.views[viewId];
      const id = newIds[ids.size];
      if (view === undefined || id === undefined) return [];
      ids.set(viewId, id);
      return [{ ...view, id, databaseId: copy.id }];
    }),
  );
  return { views, ids };
}

// The copied root keeps its parent and is named as a copy; no copy is a
// favorite, which is a choice about the original.
function finish(block: Block, isRoot: boolean, ids: ViewCopies["ids"]): Block {
  const viewIds = viewIdsOf(block).map((id) => ids.get(id) ?? id);
  const props = {
    ...block.props,
    ...(block.type === DATABASE_TYPE && { viewIds }),
    ...("isFavorite" in block.props && { isFavorite: false }),
  };
  if (!isRoot || !isPageLike(block)) return { ...block, props };
  const isUntitled = plainText(block.props.title).trim() === "";
  const name = isUntitled
    ? [{ text: COPY.sidebar.untitled }]
    : block.props.title;
  const suffix = [{ text: ` ${COPY.pageMenu.copySuffix}` }];
  const title = concatRichText(name, suffix);
  return { ...block, props: { ...props, title } };
}

interface CopyPlan {
  readonly records: readonly Block[];
  readonly views: readonly View[];
}

// The copied blocks, in tree order with the root first, and their views;
// undefined when the new ids do not cover the tree.
function planCopy(
  state: AppState,
  page: Block,
  command: PageCopySize & { readonly meta: CommandMeta },
): CopyPlan | undefined {
  const { blockIds, viewIds, now } = command.meta;
  const ids = { rootId: page.id, ids: blockIds, now };
  const copies = copyBlockTree(state.workspace, ids);
  if (copies?.length !== command.blockCount) return undefined;
  const pairs = treeBlocks(state, page.id).flatMap((block, index) => {
    const copy = copies[index];
    return copy === undefined ? [] : [[block, copy] as const];
  });
  const views = copyViews(state, pairs, viewIds);
  if (views.views.length !== command.viewCount) return undefined;
  const records = pairs.map(([, copy], index) =>
    finish(copy, index === 0, views.ids),
  );
  return { records, views: views.views };
}

export const duplicatePage = defineCommand<{ pageId: BlockId } & PageCopySize>({
  type: "page.duplicate",
  newIds: (payload) => ({
    blocks: payload.blockCount,
    views: payload.viewCount,
  }),
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    const plan =
      page === undefined ? undefined : planCopy(state, page, command);
    const root = plan?.records[0];
    if (page === undefined || plan === undefined || root === undefined)
      return {};
    const siblings = siblingIds(state.workspace, page.parentId);
    const index = siblings.indexOf(page.id) + 1;
    const operations: Operation[] = [
      ...plan.records.map((record): Operation => ({
        type: "record.create",
        kind: "block",
        record,
      })),
      ...plan.views.map((record): Operation => ({
        type: "record.create",
        kind: "view",
        record,
      })),
      { type: "list.insert", list: listOf(page.parentId), id: root.id, index },
    ];
    return { operations, ui: { ...state.ui, activePageId: root.id } };
  },
});

export const pageDuplicateCommands = [duplicatePage];
