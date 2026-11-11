// The operations that columns are built from: making a block, moving one
// and removing one.
import {
  listOf,
  type Block,
  type BlockId,
  type BlockProps,
  type Operation,
} from "../../model/index.ts";

export interface Place {
  readonly parentId: BlockId;
  readonly index: number;
}

export function moveOps(block: Block, to: Place): Operation[] {
  const { parentId } = to;
  return [
    { type: "list.remove", list: listOf(block.parentId), id: block.id },
    {
      type: "list.insert",
      list: listOf(parentId),
      id: block.id,
      index: to.index,
    },
    { type: "record.update", kind: "block", id: block.id, patch: { parentId } },
  ];
}

export function removeOps(block: Block): Operation[] {
  return [
    { type: "list.remove", list: listOf(block.parentId), id: block.id },
    { type: "record.delete", kind: "block", id: block.id },
  ];
}

export interface NewBlock {
  readonly id: BlockId;
  readonly type: string;
  readonly props: BlockProps;
  readonly now: string;
}

export function createOps(spec: NewBlock, place: Place): Operation[] {
  const record: Block = {
    id: spec.id,
    type: spec.type,
    parentId: place.parentId,
    childIds: [],
    props: spec.props,
    createdAt: spec.now,
    updatedAt: spec.now,
  };
  return [
    { type: "record.create", kind: "block", record },
    {
      type: "list.insert",
      list: listOf(place.parentId),
      id: spec.id,
      index: place.index,
    },
  ];
}
