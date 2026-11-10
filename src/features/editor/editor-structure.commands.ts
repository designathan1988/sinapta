// Commands that change which blocks exist and where they sit.
import { blockDefinition } from "../../blocks/block-registry.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import {
  isTextBlock,
  textOf,
  type TextBlock,
} from "../../blocks/text-block.ts";
import {
  concatRichText,
  snapToBoundary,
  splitRichText,
  type Block,
  type BlockId,
  type ListRef,
  type Operation,
  type RichText,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import { caretAt, setText } from "./editor.commands.ts";
import {
  selectChildBlocks,
  selectNeighborTextBlock,
} from "./editor.selectors.ts";

interface NewBlock {
  readonly id: BlockId;
  readonly type: string;
  readonly parentId: BlockId;
  readonly text: RichText;
  readonly now: string;
}

function createBlock(spec: NewBlock): Block {
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

function childList(blockId: BlockId): ListRef {
  return { kind: "childIds", blockId };
}

function indexIn(state: AppState, block: Block): number {
  const parent =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  return parent?.childIds.indexOf(block.id) ?? -1;
}

function withSelection(state: AppState, blockId: BlockId, offset: number) {
  return { ...state.ui, selection: caretAt(blockId, offset) };
}

// Turns a block into another type, keeping its text.
function convert(block: TextBlock, type: string, now: string): Operation {
  const props = blockDefinition(type)?.createProps(block.props.text) ?? {};
  const patch = { type, props, updatedAt: now };
  return { type: "record.update", kind: "block", id: block.id, patch };
}

// Adds an empty paragraph at the end of a page and puts the caret in it.
export const appendParagraph = defineCommand<{ pageId: BlockId }>({
  type: "block.append",
  newBlockIds: 1,
  handle(state, command) {
    const page = state.workspace.blocks[command.pageId];
    const id = command.meta.blockIds[0];
    if (page === undefined || id === undefined) return {};
    const { now } = command.meta;
    const record = createBlock({
      id,
      type: PARAGRAPH_TYPE,
      parentId: page.id,
      text: [],
      now,
    });
    const index = page.childIds.length;
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: childList(page.id), id, index },
      ],
      ui: withSelection(state, id, 0),
    };
  },
});

// Enter: the text after the caret moves to a new block below. Enter in an
// empty list item or to-do leaves the list instead.
export const splitBlock = defineCommand<{ blockId: BlockId; offset: number }>({
  type: "block.split",
  newBlockIds: 1,
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const id = command.meta.blockIds[0];
    if (!isTextBlock(block) || block.parentId === null || id === undefined)
      return {};
    const { now } = command.meta;
    if (textOf(block) === "" && block.type !== PARAGRAPH_TYPE) {
      return { operations: [convert(block, PARAGRAPH_TYPE, now)] };
    }
    const offset = snapToBoundary(textOf(block), command.offset);
    const [before, after] = splitRichText(block.props.text, offset);
    const type = blockDefinition(block.type)?.continuesAs ?? PARAGRAPH_TYPE;
    const { parentId } = block;
    const record = createBlock({ id, type, parentId, text: after, now });
    const index = indexIn(state, block) + 1;
    return {
      operations: [
        ...setText(state, { blockId: block.id, text: before, now }),
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: childList(parentId), id, index },
      ],
      ui: withSelection(state, id, 0),
    };
  },
});

// Moves a block to a new parent and position.
function move(block: Block, parentId: BlockId, index: number): Operation[] {
  if (block.parentId === null) return [];
  return [
    { type: "list.remove", list: childList(block.parentId), id: block.id },
    { type: "list.insert", list: childList(parentId), id: block.id, index },
    { type: "record.update", kind: "block", id: block.id, patch: { parentId } },
  ];
}

function outdent(state: AppState, block: Block): Operation[] {
  const parent =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  if (parent === undefined || !isTextBlock(parent) || parent.parentId === null)
    return [];
  return move(block, parent.parentId, indexIn(state, parent) + 1);
}

// Tab: the block becomes the last child of the block above it.
export const indentBlock = defineCommand<{ blockId: BlockId }>({
  type: "block.indent",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block?.parentId == null) return {};
    const siblings = selectChildBlocks(state, block.parentId);
    const above =
      siblings[siblings.findIndex((item) => item.id === block.id) - 1];
    if (!isTextBlock(above)) return {};
    return { operations: move(block, above.id, above.childIds.length) };
  },
});

// Shift+Tab: the block moves out, to just after its parent.
export const outdentBlock = defineCommand<{ blockId: BlockId }>({
  type: "block.outdent",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    return block === undefined ? {} : { operations: outdent(state, block) };
  },
});

// Joins a block's text onto the end of the text block before it. The
// joined block's children take its place.
function joinInto(
  state: AppState,
  block: TextBlock,
  now: string,
): CommandEffect {
  const previous = selectNeighborTextBlock(state, block.id, -1);
  if (previous === undefined || block.parentId === null) return {};
  const index = indexIn(state, block);
  const children = block.childIds.flatMap((childId, position) => {
    const child = state.workspace.blocks[childId];
    return child === undefined
      ? []
      : move(child, block.parentId ?? child.id, index + position);
  });
  const text = concatRichText(previous.props.text, block.props.text);
  return {
    operations: [
      ...children,
      { type: "list.remove", list: childList(block.parentId), id: block.id },
      { type: "record.delete", kind: "block", id: block.id },
      ...setText(state, { blockId: previous.id, text, now }),
    ],
    ui: withSelection(state, previous.id, textOf(previous).length),
  };
}

// Backspace at the start of a block: first it becomes a plain paragraph,
// then it moves out one level, then it joins the block before it.
export const mergeBlockBackward = defineCommand<{ blockId: BlockId }>({
  type: "block.mergeBackward",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const { now } = command.meta;
    if (block.type !== PARAGRAPH_TYPE) {
      return { operations: [convert(block, PARAGRAPH_TYPE, now)] };
    }
    const outdented = outdent(state, block);
    if (outdented.length > 0) return { operations: outdented };
    return joinInto(state, block, now);
  },
});

export const editorStructureCommands = [
  appendParagraph,
  splitBlock,
  indentBlock,
  outdentBlock,
  mergeBlockBackward,
];
