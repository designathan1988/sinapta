// Moving a block within the tree: the one place that knows how a move is
// expressed as operations and which moves are allowed.
import type { BlockId } from "./id.schema.ts";
import type { ListRef, Operation } from "./operation.ts";
import type { Workspace } from "./workspace.schema.ts";

export interface BlockMove {
  readonly blockId: BlockId;
  readonly parentId: BlockId | null;
  // Position among the new siblings, counted without the moved block.
  readonly index: number;
}

export type DropPosition = "before" | "after" | "inside";

export function listOf(parentId: BlockId | null): ListRef {
  return parentId === null
    ? { kind: "rootIds" }
    : { kind: "childIds", blockId: parentId };
}

export function siblingIds(
  workspace: Workspace,
  parentId: BlockId | null,
): readonly BlockId[] {
  if (parentId === null) return workspace.rootIds;
  return workspace.blocks[parentId]?.childIds ?? [];
}

// True when `blockId` is `ancestorId` or lies somewhere inside it.
export function isSelfOrInside(
  workspace: Workspace,
  blockId: BlockId | null,
  ancestorId: BlockId,
): boolean {
  let current = blockId;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = workspace.blocks[current]?.parentId ?? null;
  }
  return false;
}

// The operations of a move, or none when the move is not allowed (into
// itself, into a missing parent) or would change nothing.
export function planMove(workspace: Workspace, move: BlockMove): Operation[] {
  const { blockId, parentId } = move;
  const block = workspace.blocks[blockId];
  if (block === undefined || isSelfOrInside(workspace, parentId, blockId))
    return [];
  if (parentId !== null && workspace.blocks[parentId] === undefined) return [];
  const siblings = siblingIds(workspace, parentId).filter(
    (id) => id !== blockId,
  );
  const index = Math.max(0, Math.min(move.index, siblings.length));
  const current = siblingIds(workspace, block.parentId).indexOf(blockId);
  if (block.parentId === parentId && current === index) return [];
  return [
    { type: "list.remove", list: listOf(block.parentId), id: blockId },
    { type: "list.insert", list: listOf(parentId), id: blockId, index },
    { type: "record.update", kind: "block", id: blockId, patch: { parentId } },
  ];
}

export interface Drop {
  readonly targetId: BlockId;
  readonly position: DropPosition;
}

// Where dropping one block on another puts it.
export function dropMove(
  workspace: Workspace,
  blockId: BlockId,
  drop: Drop,
): BlockMove | undefined {
  const target = workspace.blocks[drop.targetId];
  if (target === undefined || drop.targetId === blockId) return undefined;
  if (drop.position === "inside") {
    const index = target.childIds.filter((id) => id !== blockId).length;
    return { blockId, parentId: target.id, index };
  }
  const siblings = siblingIds(workspace, target.parentId).filter(
    (id) => id !== blockId,
  );
  const index =
    siblings.indexOf(target.id) + (drop.position === "after" ? 1 : 0);
  return { blockId, parentId: target.parentId, index };
}
