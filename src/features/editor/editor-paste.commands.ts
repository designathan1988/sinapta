// Pasting several lines into a block: each line becomes a block of its own.
import { blockDefinition } from "../../blocks/block-registry.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { isTextBlock, textOf } from "../../blocks/text-block.ts";
import {
  deleteRange,
  insertText,
  snapToBoundary,
  snapToBoundaryAfter,
  splitRichText,
  type BlockId,
  type Operation,
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
  // Two lines or more. One line is a `text.replace`.
  readonly lines: readonly string[];
}

// The first line joins the text before the caret. Every other line gets a
// new block below, and the text after the caret follows the last line.
export const pasteLines = defineCommand<PasteLinesPayload>({
  type: "block.pasteLines",
  newIds: (payload) => ({ blocks: Math.max(0, payload.lines.length - 1) }),
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const [first, ...rest] = command.lines;
    const { blockIds, now } = command.meta;
    if (!isTextBlock(block) || block.parentId === null) return {};
    if (first === undefined || rest.length !== blockIds.length) return {};
    const { parentId } = block;
    const current = textOf(block);
    const start = snapToBoundary(current, Math.min(command.start, command.end));
    const end = snapToBoundaryAfter(
      current,
      Math.max(command.start, command.end),
    );
    const kept = deleteRange(block.props.text, start, end);
    const [before, after] = splitRichText(kept, start);
    const type = blockDefinition(block.type)?.continuesAs ?? PARAGRAPH_TYPE;
    const index = indexIn(state, block) + 1;
    const created = rest.flatMap((line, position): Operation[] => {
      const id = blockIds[position];
      if (id === undefined) return [];
      const tail = position === rest.length - 1 ? after : [];
      const text = insertText(tail, 0, line);
      const record = createBlock({ id, type, parentId, text, now });
      const at = index + position;
      return [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: childList(parentId), id, index: at },
      ];
    });
    const text = insertText(before, start, first);
    const last = blockIds.at(-1) ?? block.id;
    const caret = (rest.at(-1) ?? "").normalize("NFC").length;
    return {
      operations: [
        ...setText(state, { blockId: block.id, text, now }),
        ...created,
      ],
      ui: withSelection(state, last, caret),
    };
  },
});

export const editorPasteCommands = [pasteLines];
