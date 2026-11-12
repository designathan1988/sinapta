// A deleted block takes its discussions with it, in the same transaction:
// the page they were on loses them.
import { isPageLike } from "../../blocks/page/index.ts";
import type {
  Block,
  BlockId,
  Operation,
  Workspace,
} from "../../model/index.ts";
import type { Tidier } from "../../state/index.ts";

// The page a block was on, in the workspace as it was.
function pageOf(workspace: Workspace, blockId: BlockId): Block | undefined {
  let id = workspace.blocks[blockId]?.parentId ?? null;
  while (id !== null) {
    const block = workspace.blocks[id];
    if (block === undefined) return undefined;
    if (isPageLike(block)) return block;
    id = block.parentId;
  }
  return undefined;
}

export const discussionTidier: Tidier = (workspace, changed, before) => {
  const deleted = [...changed].filter(
    (id) => workspace.blocks[id] === undefined,
  );
  const pageIds = new Set(
    deleted.flatMap((id) => pageOf(before, id)?.id ?? []),
  );
  return [...pageIds].flatMap((pageId): Operation[] => {
    const page = workspace.blocks[pageId];
    if (page === undefined || !isPageLike(page)) return [];
    const discussions = page.props.discussions ?? [];
    const kept = discussions.filter(
      (item) =>
        item.blockId === null || workspace.blocks[item.blockId] !== undefined,
    );
    if (kept.length === discussions.length) return [];
    const props = { ...page.props, discussions: kept };
    return [
      { type: "record.update", kind: "block", id: page.id, patch: { props } },
    ];
  });
};
