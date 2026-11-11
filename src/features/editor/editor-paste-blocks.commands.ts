// Pasting Markdown: each pasted block becomes a block of its kind, nested
// by its indent, in one undo step.
import { blockDefinition } from "../../blocks/block-registry.ts";
import {
  isTextBlock,
  textOf,
  type TextBlock,
} from "../../blocks/text-block.ts";
import {
  plainText,
  type Block,
  type BlockId,
  type BlockProps,
  type Operation,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import type { MarkdownBlock } from "../../ui/rich-text/index.ts";
import { childList, indexIn, withSelection } from "./editor-operations.ts";

export interface PasteBlocksPayload {
  // The block the caret is in. An empty one becomes the first pasted
  // block; otherwise the pasted blocks follow it.
  readonly blockId: BlockId;
  readonly blocks: readonly MarkdownBlock[];
}

// Markdown kinds are named like the block types they become.
function propsFor(block: MarkdownBlock): BlockProps {
  const base = blockDefinition(block.kind)?.createProps(block.text) ?? {};
  if (block.level !== undefined) return { ...base, level: block.level };
  if (block.isChecked !== undefined)
    return { ...base, isChecked: block.isChecked };
  return base;
}

// Where the next block goes: the last block placed at each depth, and the
// number of children each new parent has so far.
interface Placement {
  readonly target: TextBlock & { readonly parentId: BlockId };
  readonly path: BlockId[];
  readonly childCounts: Map<BlockId, number>;
  topIndex: number;
}

function placeBlock(
  placement: Placement,
  block: MarkdownBlock,
  record: Omit<Block, "parentId">,
): Operation[] {
  const { target, path, childCounts } = placement;
  const depth = Math.min(block.depth, path.length);
  const parentId = depth === 0 ? target.parentId : path[depth - 1];
  if (parentId === undefined) return [];
  const index =
    depth === 0 ? (placement.topIndex += 1) : (childCounts.get(parentId) ?? 0);
  childCounts.set(parentId, index + 1);
  path.length = depth;
  path.push(record.id);
  return [
    { type: "record.create", kind: "block", record: { ...record, parentId } },
    { type: "list.insert", list: childList(parentId), id: record.id, index },
  ];
}

function replaceTarget(target: TextBlock, block: MarkdownBlock, now: string) {
  const patch = { type: block.kind, props: propsFor(block), updatedAt: now };
  const update: Operation = {
    type: "record.update",
    kind: "block",
    id: target.id,
    patch,
  };
  return update;
}

type PasteTarget = TextBlock & { readonly parentId: BlockId };

interface PastePlan {
  readonly operations: Operation[];
  // The block the caret ends up in.
  readonly lastId: BlockId;
}

function planPaste(
  state: AppState,
  target: PasteTarget,
  command: PasteBlocksPayload & {
    readonly meta: { blockIds: readonly BlockId[]; now: string };
  },
): PastePlan {
  const { blockIds, now } = command.meta;
  const replaces = textOf(target) === "" && target.childIds.length === 0;
  const placement: Placement = {
    target,
    path: replaces ? [target.id] : [],
    childCounts: new Map(),
    topIndex: indexIn(state, target),
  };
  let lastId = target.id;
  const operations = command.blocks.flatMap((block, position) => {
    if (position === 0 && replaces) return [replaceTarget(target, block, now)];
    const id = blockIds[position];
    if (id === undefined) return [];
    lastId = id;
    const props = propsFor(block);
    const record = {
      id,
      type: block.kind,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    return placeBlock(placement, block, record);
  });
  return { operations, lastId };
}

export const pasteBlocks = defineCommand<PasteBlocksPayload>({
  type: "block.pasteBlocks",
  newIds: (payload) => ({ blocks: payload.blocks.length }),
  handle(state, command) {
    const target = state.workspace.blocks[command.blockId];
    if (!isTextBlock(target) || target.parentId === null) return {};
    const { parentId } = target;
    const plan = planPaste(state, { ...target, parentId }, command);
    const caret = plainText(command.blocks.at(-1)?.text ?? []).length;
    return {
      operations: plan.operations,
      ui: withSelection(state, plan.lastId, caret),
    };
  },
});

export const editorPasteBlocksCommands = [pasteBlocks];
