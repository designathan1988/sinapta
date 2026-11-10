// Structural rules every transaction must keep. Only the blocks a
// transaction touched are checked, so the cost does not grow with the
// workspace.
import type { Block } from "./block.schema.ts";
import type { BlockId } from "./id.schema.ts";
import type { Workspace } from "./workspace.schema.ts";

export interface InvariantViolation {
  readonly kind:
    | "parent-mismatch"
    | "duplicate-child"
    | "dangling-child"
    | "orphan"
    | "cycle";
  readonly blockId: BlockId;
}

type Check = InvariantViolation | undefined;

function siblingsOf(workspace: Workspace, block: Block): readonly BlockId[] {
  if (block.parentId === null) return workspace.rootIds;
  return workspace.blocks[block.parentId]?.childIds ?? [];
}

function checkChildren(workspace: Workspace, block: Block): Check {
  if (new Set(block.childIds).size !== block.childIds.length) {
    return { kind: "duplicate-child", blockId: block.id };
  }
  for (const childId of block.childIds) {
    const child = workspace.blocks[childId];
    if (child === undefined)
      return { kind: "dangling-child", blockId: block.id };
    if (child.parentId !== block.id) {
      return { kind: "parent-mismatch", blockId: childId };
    }
  }
  return undefined;
}

function checkParent(workspace: Workspace, block: Block): Check {
  const count = siblingsOf(workspace, block).filter(
    (id) => id === block.id,
  ).length;
  if (count === 1) return undefined;
  if (count > 1 && block.parentId !== null) {
    return { kind: "duplicate-child", blockId: block.parentId };
  }
  return { kind: "parent-mismatch", blockId: block.id };
}

function checkCycle(workspace: Workspace, block: Block): Check {
  const seen = new Set<BlockId>([block.id]);
  let parentId = block.parentId;
  while (parentId !== null) {
    if (seen.has(parentId)) return { kind: "cycle", blockId: block.id };
    seen.add(parentId);
    parentId = workspace.blocks[parentId]?.parentId ?? null;
  }
  return undefined;
}

// A deleted block must leave nothing pointing at it.
function checkDeleted(workspace: Workspace, deleted: Block): Check {
  const orphanId = deleted.childIds.find(
    (childId) => workspace.blocks[childId]?.parentId === deleted.id,
  );
  if (orphanId !== undefined) return { kind: "orphan", blockId: orphanId };
  if (workspace.rootIds.includes(deleted.id)) {
    return { kind: "dangling-child", blockId: deleted.id };
  }
  const parent =
    deleted.parentId === null ? undefined : workspace.blocks[deleted.parentId];
  if (parent?.childIds.includes(deleted.id) === true) {
    return { kind: "dangling-child", blockId: parent.id };
  }
  return undefined;
}

function checkBlock(
  previous: Workspace,
  next: Workspace,
  blockId: BlockId,
): Check {
  const block = next.blocks[blockId];
  if (block === undefined) {
    const deleted = previous.blocks[blockId];
    return deleted === undefined ? undefined : checkDeleted(next, deleted);
  }
  return (
    checkChildren(next, block) ??
    checkParent(next, block) ??
    checkCycle(next, block)
  );
}

export function findInvariantViolation(
  previous: Workspace,
  next: Workspace,
  changedBlockIds: ReadonlySet<BlockId>,
): InvariantViolation | undefined {
  for (const blockId of changedBlockIds) {
    const violation = checkBlock(previous, next, blockId);
    if (violation !== undefined) return violation;
  }
  return undefined;
}
