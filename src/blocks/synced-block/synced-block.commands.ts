// What synced blocks show, and unsyncing a reference: it keeps a copy of
// the original's blocks as its own.
import {
  copyBlockTree,
  countBlockTree,
  isBlockOfType,
  isSelfOrInside,
  listOf,
  parseBlockId,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { SYNCED_BLOCK_TYPE, type SyncedBlock } from "./synced-block.schema.ts";

export function syncedOf(state: AppState, blockId: BlockId) {
  const block = state.workspace.blocks[blockId];
  return block !== undefined &&
    isBlockOfType<SyncedBlock>(block, SYNCED_BLOCK_TYPE)
    ? block
    : undefined;
}

// The block whose children a block shows: a reference shows its
// original's, unless that would show the reference inside itself.
export function shownHolder(state: AppState, block: Block): BlockId {
  const sourceId =
    block.type === SYNCED_BLOCK_TYPE ? block.props.sourceId : undefined;
  const sourceBlockId =
    typeof sourceId === "string" ? parseBlockId(sourceId) : undefined;
  if (sourceBlockId === undefined) return block.id;
  const source = state.workspace.blocks[sourceBlockId];
  if (
    source === undefined ||
    isSelfOrInside(state.workspace, block.id, source.id)
  ) {
    return block.id;
  }
  return source.id;
}

export function selectShownChildren(
  state: AppState,
  blockId: BlockId,
): Block[] {
  const block = state.workspace.blocks[blockId];
  if (block === undefined) return [];
  const holder = state.workspace.blocks[shownHolder(state, block)];
  return (holder?.childIds ?? []).flatMap(
    (id) => state.workspace.blocks[id] ?? [],
  );
}

// The number of blocks an unsynced reference copies: everything inside its
// original.
export function selectUnsyncSize(state: AppState, blockId: BlockId): number {
  return selectShownChildren(state, blockId).reduce(
    (sum, child) => sum + countBlockTree(state.workspace, child.id),
    0,
  );
}

export const unsyncBlock = defineCommand<{
  blockId: BlockId;
  blockCount: number;
}>({
  type: "syncedBlock.unsync",
  newIds: (payload) => ({ blocks: payload.blockCount }),
  handle(state, command) {
    const reference = syncedOf(state, command.blockId);
    if (reference?.props.sourceId === undefined) return {};
    const children = selectShownChildren(state, reference.id);
    const ids = [...command.meta.blockIds];
    const operations: Operation[] = [];
    for (const [index, child] of children.entries()) {
      const count = countBlockTree(state.workspace, child.id);
      const copies = copyBlockTree(state.workspace, {
        rootId: child.id,
        ids: ids.splice(0, count),
        now: command.meta.now,
      });
      const [root, ...inside] = copies ?? [];
      if (root === undefined) return {};
      const records = [{ ...root, parentId: reference.id }, ...inside];
      operations.push(
        ...records.map((record): Operation => ({
          type: "record.create",
          kind: "block",
          record,
        })),
        { type: "list.insert", list: listOf(reference.id), id: root.id, index },
      );
    }
    const { sourceId: _source, ...props } = reference.props;
    operations.push({
      type: "record.update",
      kind: "block",
      id: reference.id,
      patch: { props, updatedAt: command.meta.now },
    });
    return { operations };
  },
});

export const syncedBlockCommands = [unsyncBlock];
