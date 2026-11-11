// Builders of the operations the editor's commands share.
import { blockDefinition, type TextBlock } from "../../blocks/index.ts";
import type {
  Block,
  BlockId,
  ListRef,
  Operation,
  RichText,
} from "../../model/index.ts";
import type { AppState, UiState } from "../../state/index.ts";
import { caretAt } from "./editor.commands.ts";

export interface NewBlock {
  readonly id: BlockId;
  readonly type: string;
  readonly parentId: BlockId;
  readonly text: RichText;
  readonly now: string;
}

export function createBlock(spec: NewBlock): Block {
  const props = blockDefinition(spec.type)?.createProps(spec.text) ?? {};
  const { id, type, parentId, now } = spec;
  return {
    id,
    type,
    parentId,
    childIds: [],
    props,
    createdAt: now,
    updatedAt: now,
  };
}

export function childList(blockId: BlockId): ListRef {
  return { kind: "childIds", blockId };
}

export function indexIn(state: AppState, block: Block): number {
  const parent =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  return parent?.childIds.indexOf(block.id) ?? -1;
}

export function withSelection(
  state: AppState,
  blockId: BlockId,
  offset: number,
): UiState {
  return { ...state.ui, selection: caretAt(blockId, offset) };
}

// Turns a block into another type, keeping its text.
export function convertOperation(
  block: TextBlock,
  type: string,
  now: string,
): Operation {
  const props = blockDefinition(type)?.createProps(block.props.text) ?? {};
  const patch = { type, props, updatedAt: now };
  return { type: "record.update", kind: "block", id: block.id, patch };
}

// Moves a block to a new parent and position.
export function moveOperations(
  block: Block,
  parentId: BlockId,
  index: number,
): Operation[] {
  if (block.parentId === null) return [];
  return [
    { type: "list.remove", list: childList(block.parentId), id: block.id },
    { type: "list.insert", list: childList(parentId), id: block.id, index },
    { type: "record.update", kind: "block", id: block.id, patch: { parentId } },
  ];
}
