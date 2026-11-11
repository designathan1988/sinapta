// Copies of a block with everything inside it, for duplicating blocks and
// pages. Ids come from the caller: model code never creates them.
import type { Block } from "./block.schema.ts";
import type { BlockId } from "./id.schema.ts";
import type { Workspace } from "./workspace.schema.ts";

// The blocks of a tree in the order a copy gives out new ids: each block
// before its children.
function treeOrder(workspace: Workspace, rootId: BlockId): Block[] {
  const root = workspace.blocks[rootId];
  if (root === undefined) return [];
  return [root, ...root.childIds.flatMap((id) => treeOrder(workspace, id))];
}

export function countBlockTree(workspace: Workspace, rootId: BlockId): number {
  return treeOrder(workspace, rootId).length;
}

export interface BlockTreeCopy {
  readonly rootId: BlockId;
  // One new id per block of the tree, in tree order.
  readonly ids: readonly BlockId[];
  readonly now: string;
}

// The copied records, the root first, or undefined when the ids do not
// cover the tree. The copy's root keeps the original's parent.
export function copyBlockTree(
  workspace: Workspace,
  copy: BlockTreeCopy,
): Block[] | undefined {
  const originals = treeOrder(workspace, copy.rootId);
  if (originals.length === 0 || copy.ids.length < originals.length)
    return undefined;
  const newIds = new Map<BlockId, BlockId>();
  originals.forEach((block, index) => {
    const id = copy.ids[index];
    if (id !== undefined) newIds.set(block.id, id);
  });
  const mapped = (id: BlockId): BlockId => newIds.get(id) ?? id;
  return originals.map((block) => ({
    ...block,
    id: mapped(block.id),
    parentId: block.parentId === null ? null : mapped(block.parentId),
    childIds: block.childIds.map(mapped),
    createdAt: copy.now,
    updatedAt: copy.now,
  }));
}
