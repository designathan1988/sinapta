// When an original synced block is deleted, every reference to it keeps
// a copy of what it showed, in the same transaction, and stops being a
// reference. The copies take ids made from the reference's and the
// original block's ids, since a tidier has no new ids of its own.
import {
  listOf,
  parseBlockId,
  type Block,
  type BlockId,
  type Operation,
  type Workspace,
} from "../../model/index.ts";
import type { Tidier } from "../../state/index.ts";
import { SYNCED_BLOCK_TYPE } from "./synced-block.schema.ts";

function deletedOriginals(
  workspace: Workspace,
  changed: ReadonlySet<BlockId>,
  before: Workspace,
): Block[] {
  return [...changed].flatMap((id) => {
    const old = before.blocks[id];
    const isOriginal =
      old?.type === SYNCED_BLOCK_TYPE && old.props.sourceId === undefined;
    return isOriginal && workspace.blocks[id] === undefined ? [old] : [];
  });
}

// The original's blocks as they were, under the reference, with new ids.
function copyUnder(reference: Block, original: Block, before: Workspace) {
  const newId = (id: BlockId): BlockId =>
    parseBlockId(`${reference.id}~${id}`) ?? id;
  const records: Block[] = [];
  const copy = (id: BlockId, parentId: BlockId): void => {
    const old = before.blocks[id];
    if (old === undefined) return;
    records.push({
      ...old,
      id: newId(id),
      parentId,
      childIds: old.childIds.map(newId),
    });
    for (const childId of old.childIds) copy(childId, newId(id));
  };
  for (const childId of original.childIds) copy(childId, reference.id);
  const operations: Operation[] = records.map((record) => ({
    type: "record.create",
    kind: "block",
    record,
  }));
  const inserts = original.childIds.map((childId, index): Operation => ({
    type: "list.insert",
    list: listOf(reference.id),
    id: newId(childId),
    index,
  }));
  return [...operations, ...inserts];
}

function unsyncOps(reference: Block, original: Block, before: Workspace) {
  const { sourceId: _source, ...props } = reference.props;
  const update: Operation = {
    type: "record.update",
    kind: "block",
    id: reference.id,
    patch: { props },
  };
  return [...copyUnder(reference, original, before), update];
}

export const tidySyncedBlocks: Tidier = (workspace, changed, before) =>
  deletedOriginals(workspace, changed, before).flatMap((original) =>
    Object.values(workspace.blocks)
      .filter(
        (block) =>
          block.type === SYNCED_BLOCK_TYPE &&
          block.props.sourceId === original.id,
      )
      .flatMap((reference) => unsyncOps(reference, original, before)),
  );
