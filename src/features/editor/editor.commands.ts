// Commands that change the text inside one block.
import { isTextBlock } from "../../blocks/text-block.ts";
import {
  deleteRange,
  insertText,
  plainText,
  snapToBoundary,
  snapToBoundaryAfter,
  toggleMark,
  type BlockId,
  type Mark,
  type Operation,
  type RichText,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type TextSelection,
} from "../../state/index.ts";

export function caretAt(blockId: BlockId, offset: number): TextSelection {
  return { blockId, anchorOffset: offset, focusOffset: offset };
}

export interface TextChange {
  readonly blockId: BlockId;
  readonly text: RichText;
  readonly now: string;
}

export function setText(state: AppState, change: TextChange): Operation[] {
  const block = state.workspace.blocks[change.blockId];
  if (block === undefined) return [];
  const props = { ...block.props, text: change.text };
  const patch = { props, updatedAt: change.now };
  return [{ type: "record.update", kind: "block", id: block.id, patch }];
}

export interface ReplaceTextPayload {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

// Replaces a range of a block's text: typing, deleting and pasting are all
// this one command. The range is widened to whole characters.
export const replaceText = defineCommand<ReplaceTextPayload>({
  type: "text.replace",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const current = plainText(block.props.text);
    const start = snapToBoundary(current, Math.min(command.start, command.end));
    const end = snapToBoundaryAfter(
      current,
      Math.max(command.start, command.end),
    );
    if (start === end && command.text === "") return {};
    const kept = deleteRange(block.props.text, start, end);
    const text = insertText(kept, start, command.text);
    const caret = start + command.text.normalize("NFC").length;
    return {
      operations: setText(state, {
        blockId: block.id,
        text,
        now: command.meta.now,
      }),
      ui: { ...state.ui, selection: caretAt(block.id, caret) },
      mergeKey: `text:${block.id}`,
    };
  },
});

export interface ToggleMarkPayload {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
  readonly mark: Mark;
}

export const toggleTextMark = defineCommand<ToggleMarkPayload>({
  type: "text.toggleMark",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const text = toggleMark(block.props.text, command);
    if (text === block.props.text) return {};
    return {
      operations: setText(state, {
        blockId: block.id,
        text,
        now: command.meta.now,
      }),
    };
  },
});

export const editorCommands = [replaceText, toggleTextMark];
