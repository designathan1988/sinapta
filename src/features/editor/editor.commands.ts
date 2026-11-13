// Commands that change the text inside one block.
import { isTextBlock } from "../../blocks/index.ts";
import {
  applyInlineMarkdownTo,
  deleteRange,
  insertText,
  plainText,
  safeHref,
  setLink,
  setTone,
  clearFormat,
  snapToBoundary,
  snapToBoundaryAfter,
  toggleMark,
  type BlockId,
  type InlineMarkdownMatch,
  type Mark,
  type Operation,
  type RichText,
  type Tone,
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

// Formats Markdown typed inside a line once its closing marker is typed.
// It is its own step in history, so one undo brings the markers back.
export const applyInlineMarkdown = defineCommand<
  InlineMarkdownMatch & { blockId: BlockId }
>({
  type: "text.applyInlineMarkdown",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const text = applyInlineMarkdownTo(block.props.text, command);
    if (text === undefined) return {};
    const caret = command.end - 2 * command.markerLength;
    return {
      operations: setText(state, {
        blockId: block.id,
        text,
        now: command.meta.now,
      }),
      ui: { ...state.ui, selection: caretAt(block.id, caret) },
    };
  },
});

export interface SetLinkPayload {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
  // A link target, or null to remove the link. Targets other than http,
  // https and mailto are refused.
  readonly href: string | null;
}

export const setTextLink = defineCommand<SetLinkPayload>({
  type: "text.setLink",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const href = command.href === null ? undefined : safeHref(command.href);
    if (command.href !== null && href === undefined) return {};
    const text = setLink(block.props.text, { ...command, href });
    return {
      operations: setText(state, {
        blockId: block.id,
        text,
        now: command.meta.now,
      }),
    };
  },
});

export interface SetTonePayload {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
  readonly key: "color" | "highlight";
  // A tone name, or null to remove the color or highlight.
  readonly tone: Tone | null;
}

export const setTextTone = defineCommand<SetTonePayload>({
  type: "text.setTone",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const tone = command.tone ?? undefined;
    const text = setTone(block.props.text, { ...command, tone });
    if (text === block.props.text) return {};
    const lastTone = { key: command.key, tone: command.tone };
    return {
      operations: setText(state, {
        blockId: block.id,
        text,
        now: command.meta.now,
      }),
      ui: { ...state.ui, lastTone },
    };
  },
});

export interface ClearFormatPayload {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

// Notion's Clear formatting over the selected text.
export const clearTextFormat = defineCommand<ClearFormatPayload>({
  type: "text.clearFormat",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (!isTextBlock(block)) return {};
    const text = clearFormat(block.props.text, command);
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

export const editorCommands = [
  replaceText,
  toggleTextMark,
  applyInlineMarkdown,
  setTextLink,
  setTextTone,
  clearTextFormat,
];
