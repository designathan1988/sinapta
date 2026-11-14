// Commands that change which blocks exist and where they sit.
import {
  blockDefinition,
  isTextBlock,
  type TextBlock,
  textOf,
} from "../../blocks/index.ts";
import { DATABASE_TYPE } from "../../blocks/page/index.ts";
import { HEADING_TYPE } from "../../blocks/heading/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { TOGGLE_TYPE } from "../../blocks/toggle/index.ts";
import {
  concatRichText,
  snapToBoundary,
  splitRichText,
  type Block,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import {
  childList,
  convertOperation,
  createBlock,
  indexIn,
  moveOperations,
  withSelection,
} from "./editor-operations.ts";
import { setText } from "./editor.commands.ts";
import {
  selectChildBlocks,
  selectNeighborTextBlock,
} from "./editor.selectors.ts";

// Adds an empty paragraph at the end of a page and puts the caret in it;
// a database holds rows only, so it takes none.
export const appendParagraph = defineCommand<{ pageId: BlockId }>({
  type: "block.append",
  newBlockIds: 1,
  handle(state, command) {
    const page = state.workspace.blocks[command.pageId];
    const id = command.meta.blockIds[0];
    if (page === undefined || id === undefined) return {};
    if (page.type === DATABASE_TYPE) return {};
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

// An open toggle, or an open toggle heading: Enter in its title writes
// its first line inside.
function opensInside(block: Block): boolean {
  const { isOpen, isToggleable } = block.props;
  if (block.type === TOGGLE_TYPE) return isOpen === true;
  return (
    block.type === HEADING_TYPE && isToggleable === true && isOpen !== false
  );
}

// Where Enter's new line goes, and what it is: as Notion's, a line inside
// an open toggle, first; else the kind that continues this one, after it.
function newLinePlace(
  state: AppState,
  block: Block & { readonly parentId: BlockId },
) {
  if (opensInside(block)) {
    return { type: PARAGRAPH_TYPE, parentId: block.id, index: 0 };
  }
  return {
    type: blockDefinition(block.type)?.continuesAs ?? PARAGRAPH_TYPE,
    parentId: block.parentId,
    index: indexIn(state, block) + 1,
  };
}

function outdent(state: AppState, block: Block): Operation[] {
  const parent =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  if (parent === undefined || !isTextBlock(parent) || parent.parentId === null)
    return [];
  return moveOperations(block, parent.parentId, indexIn(state, parent) + 1);
}

// Enter: the text after the caret moves to a new block below. Enter in an
// empty list item or to-do leaves the list, and in an empty nested
// paragraph leaves the nesting, instead.
export const splitBlock = defineCommand<{ blockId: BlockId; offset: number }>({
  type: "block.split",
  newBlockIds: 1,
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const id = command.meta.blockIds[0];
    if (!isTextBlock(block) || block.parentId === null || id === undefined)
      return {};
    const { now } = command.meta;
    // As Notion's, Enter in an empty nested block steps out one level and
    // keeps its kind; an empty list item at the top leaves the list.
    const outdented = textOf(block) === "" ? outdent(state, block) : [];
    if (outdented.length > 0) return { operations: outdented };
    if (textOf(block) === "" && block.type !== PARAGRAPH_TYPE) {
      return { operations: [convertOperation(block, PARAGRAPH_TYPE, now)] };
    }
    const offset = snapToBoundary(textOf(block), command.offset);
    const [before, after] = splitRichText(block.props.text, offset);
    const { type, parentId, index } = newLinePlace(state, {
      ...block,
      parentId: block.parentId,
    });
    const record = createBlock({ id, type, parentId, text: after, now });
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
    return {
      operations: moveOperations(block, above.id, above.childIds.length),
    };
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
      : moveOperations(child, block.parentId ?? child.id, index + position);
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
      return { operations: [convertOperation(block, PARAGRAPH_TYPE, now)] };
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
