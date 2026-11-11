// Inline equations in a block's text: selected text becomes one, and an
// equation's source changes, or goes with the equation when it is
// cleared.
import { isTextBlock } from "../../blocks/index.ts";
import {
  deleteRange,
  insertMention,
  plainText,
  splitRichText,
  type BlockId,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { caretAt, setText } from "./editor.commands.ts";

// The overlay of the inline equation editor; its start and end are the
// equation's place in the text.
export const INLINE_EQUATION_OVERLAY = "inline-equation";

interface TextRange {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

export const makeInlineEquation = defineCommand<TextRange>({
  type: "text.makeEquation",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const start = Math.min(command.start, command.end);
    const end = Math.max(command.start, command.end);
    if (!isTextBlock(block) || start === end) return {};
    const [, rest] = splitRichText(block.props.text, start);
    const [selected] = splitRichText(rest, end - start);
    const source = plainText(selected);
    const span = { text: source, equation: source };
    const text = insertMention(block.props.text, { start, end, span });
    const { now } = command.meta;
    return {
      operations: setText(state, { blockId: block.id, text, now }),
      ui: { ...state.ui, selection: caretAt(block.id, start + source.length) },
    };
  },
});

// Typing in the editor changes the equation in place; the open editor
// follows its new end.
export const setInlineEquation = defineCommand<TextRange & { source: string }>({
  type: "text.setEquation",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const { start, end } = command;
    const source = command.source.normalize("NFC");
    const span = { text: source, equation: source };
    const text =
      source === ""
        ? deleteRange(block.props.text, start, end)
        : insertMention(block.props.text, { start, end, span });
    const { overlay } = state.ui;
    const isEditing = overlay?.kind === INLINE_EQUATION_OVERLAY;
    const ui = isEditing
      ? { ...state.ui, overlay: { ...overlay, end: start + source.length } }
      : state.ui;
    const { now } = command.meta;
    return {
      operations: setText(state, { blockId: block.id, text, now }),
      ui,
      mergeKey: `text.setEquation:${block.id}:${String(start)}`,
    };
  },
});

export const editorEquationCommands = [makeInlineEquation, setInlineEquation];
