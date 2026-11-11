// Pasting into a block. The first pasted line joins the block's text;
// every other line becomes a block of its own.
import {
  blockDefinition,
  isTextBlock,
  type TextBlock,
  textOf,
} from "../../blocks/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import {
  concatRichText,
  deleteRange,
  plainText,
  snapToBoundary,
  snapToBoundaryAfter,
  splitRichText,
  type BlockId,
  type Operation,
  type RichText,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import {
  childList,
  createBlock,
  indexIn,
  withSelection,
} from "./editor-operations.ts";
import { setText } from "./editor.commands.ts";

export interface PasteLinesPayload {
  readonly blockId: BlockId;
  // The range of the block's text that the pasted text replaces.
  readonly start: number;
  readonly end: number;
  // One line or more, each with its marks and links.
  readonly lines: readonly RichText[];
}

// The text each pasted line ends up as: the first after what was before
// the caret, the last before what was after it. One line can be both.
function joinLines(
  lines: readonly RichText[],
  before: RichText,
  after: RichText,
): RichText[] {
  return lines.map((line, position) => {
    const head = position === 0 ? concatRichText(before, line) : line;
    return position === lines.length - 1 ? concatRichText(head, after) : head;
  });
}

// The block's text split where the paste goes, without what it replaces.
function splitAround(block: TextBlock, command: PasteLinesPayload) {
  const current = textOf(block);
  const from = snapToBoundary(current, Math.min(command.start, command.end));
  const to = snapToBoundaryAfter(current, Math.max(command.start, command.end));
  return splitRichText(deleteRange(block.props.text, from, to), from);
}

// The text after the caret follows the last pasted line, and the caret
// ends up between the two.
export const pasteLines = defineCommand<PasteLinesPayload>({
  type: "block.pasteLines",
  newIds: (payload) => ({ blocks: Math.max(0, payload.lines.length - 1) }),
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const { blockIds, now } = command.meta;
    const { lines } = command;
    if (!isTextBlock(block) || block.parentId === null) return {};
    if (lines.length === 0 || lines.length - 1 !== blockIds.length) return {};
    const { parentId } = block;
    const [before, after] = splitAround(block, command);
    const texts = joinLines(lines, before, after);
    const type = blockDefinition(block.type)?.continuesAs ?? PARAGRAPH_TYPE;
    const index = indexIn(state, block);
    const created = blockIds.flatMap((id, position): Operation[] => {
      const text = texts[position + 1] ?? [];
      const record = createBlock({ id, type, parentId, text, now });
      const at = index + position + 1;
      return [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: childList(parentId), id, index: at },
      ];
    });
    const first = setText(state, {
      blockId: block.id,
      text: texts[0] ?? [],
      now,
    });
    const caret =
      plainText(texts.at(-1) ?? []).length - plainText(after).length;
    return {
      operations: [...first, ...created],
      ui: withSelection(state, blockIds.at(-1) ?? block.id, caret),
    };
  },
});

export const editorPasteCommands = [pasteLines];
