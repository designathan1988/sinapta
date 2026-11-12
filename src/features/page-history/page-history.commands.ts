// A page's versions, as Notion's page history: a version holds the page
// and its own blocks, down to (not into) the pages inside it; restoring
// it brings them back as they were, in one undoable step, and never
// removes a subpage, which goes to the end of the page when its place is
// gone.
import { isPageLike } from "../../blocks/page/index.ts";
import type {
  Block,
  BlockId,
  Operation,
  Workspace,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

function ownBlocks(workspace: Workspace, block: Block): Block[] {
  return block.childIds.flatMap((id) => {
    const child = workspace.blocks[id];
    if (child === undefined || isPageLike(child)) return [];
    return [child, ...ownBlocks(workspace, child)];
  });
}

export function pageContent(workspace: Workspace, pageId: BlockId): Block[] {
  const page = workspace.blocks[pageId];
  return page === undefined ? [] : [page, ...ownBlocks(workspace, page)];
}

// The subpages in the page now, under its own blocks.
function subpagesOf(workspace: Workspace, content: readonly Block[]) {
  return content.flatMap((block) =>
    block.childIds.filter((id) => {
      const child = workspace.blocks[id];
      return child !== undefined && isPageLike(child);
    }),
  );
}

interface Restoring {
  readonly workspace: Workspace;
  readonly page: Block;
  readonly version: readonly Block[];
}

// The version's blocks fitted to the page now: children that no longer
// exist dropped, subpages without a place at the page's end.
function fittedBlocks(restoring: Restoring): Block[] {
  const { workspace, page, version } = restoring;
  const restored = new Set(version.map((block) => block.id));
  const subpages = subpagesOf(workspace, pageContent(workspace, page.id));
  const fit = (block: Block): Block => ({
    ...block,
    childIds: block.childIds.filter(
      (id) => restored.has(id) || subpages.includes(id),
    ),
  });
  const fitted = version.map(fit);
  const placed = new Set(fitted.flatMap((block) => block.childIds));
  const homeless = subpages.filter((id) => !placed.has(id));
  return fitted.map((block) => {
    if (block.id !== page.id) return block;
    const { isFavorite, isTrashed } = page.props;
    const props = { ...block.props, isFavorite, isTrashed };
    const childIds = [...block.childIds, ...homeless];
    return { ...block, parentId: page.parentId, childIds, props };
  });
}

function restoreOperations(restoring: Restoring): Operation[] {
  const { workspace, page } = restoring;
  const fitted = fittedBlocks(restoring);
  const restored = new Set(fitted.map((block) => block.id));
  const writes = fitted.map((block): Operation => {
    if (workspace.blocks[block.id] === undefined) {
      return { type: "record.create", kind: "block", record: block };
    }
    const { id: _id, ...patch } = block;
    return { type: "record.update", kind: "block", id: block.id, patch };
  });
  const moves = fitted.flatMap((block) =>
    block.childIds.flatMap((id): Operation[] => {
      const child = workspace.blocks[id];
      if (
        child === undefined ||
        restored.has(id) ||
        child.parentId === block.id
      )
        return [];
      return [
        {
          type: "record.update",
          kind: "block",
          id,
          patch: { parentId: block.id },
        },
      ];
    }),
  );
  const deletes = pageContent(workspace, page.id)
    .filter((block) => !restored.has(block.id))
    .map((block): Operation => ({
      type: "record.delete",
      kind: "block",
      id: block.id,
    }));
  return [...writes, ...moves, ...deletes];
}

export const restorePageVersion = defineCommand<{
  pageId: BlockId;
  blocks: readonly Block[];
}>({
  type: "page.restoreVersion",
  handle(state, command) {
    const { workspace } = state;
    const page = workspace.blocks[command.pageId];
    if (page === undefined || command.blocks[0]?.id !== page.id) return {};
    const restoring = { workspace, page, version: command.blocks };
    return { operations: restoreOperations(restoring) };
  },
});

export const pageHistoryCommands = [restorePageVersion];
