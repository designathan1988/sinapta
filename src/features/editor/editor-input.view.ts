// Translates input inside text blocks into commands. The browser's default
// edit is cancelled; the store changes and the text is projected back.
import {
  applyInlineMarkdown,
  replaceText,
  toggleTextMark,
} from "./editor.commands.ts";
import { matchBlockShortcut } from "./block-shortcut.ts";
import { convertBlock } from "./editor-convert.commands.ts";
import { pasteInto } from "./editor-paste.view.ts";
import { mergeBlockBackward, splitBlock } from "./editor-structure.commands.ts";
import { selectNeighborTextBlock } from "./editor.selectors.ts";
import { blockDefinition, isTextBlock, textOf } from "../../blocks/index.ts";
import { CODE_TYPE } from "../../blocks/code/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import {
  diffText,
  matchInlineMarkdown,
  type BlockId,
  type Mark,
} from "../../model/index.ts";
import {
  openOverlay,
  REDO_COMMAND,
  UNDO_COMMAND,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import {
  blockIdOf,
  offsetWithin,
  readSelection,
  textElementOf,
} from "../../ui/caret/index.ts";

export interface InputContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

interface Target {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

// The block and range an input event is about to change.
function targetOf(event: InputEvent): Target | undefined {
  const text = textElementOf(
    event.target instanceof Node ? event.target : null,
  );
  const blockId = blockIdOf(text);
  if (text === null || blockId === undefined) return undefined;
  const range = event.getTargetRanges()[0];
  if (range !== undefined && text.contains(range.startContainer)) {
    const start = offsetWithin(text, range.startContainer, range.startOffset);
    const end = offsetWithin(text, range.endContainer, range.endOffset);
    return { blockId, start, end };
  }
  const selection = readSelection();
  if (selection?.blockId !== blockId) return undefined;
  const { anchorOffset, focusOffset } = selection;
  return {
    blockId,
    start: Math.min(anchorOffset, focusOffset),
    end: Math.max(anchorOffset, focusOffset),
  };
}

function insertedText(event: InputEvent): string {
  const text = event.data ?? event.dataTransfer?.getData("text/plain") ?? "";
  return text.replace(/\r\n?/g, "\n");
}

type Handler = (
  target: Target,
  event: InputEvent,
  context: InputContext,
) => void;

// A space after a shortcut at the start of a paragraph converts the
// paragraph instead of being typed.
function shortcutFor(target: Target, text: string, state: AppState) {
  const block = state.workspace.blocks[target.blockId];
  const isCandidate =
    text === " " &&
    target.start === target.end &&
    block?.type === PARAGRAPH_TYPE;
  if (!isCandidate || !isTextBlock(block)) return undefined;
  const prefix = textOf(block).slice(0, target.start);
  const shortcut = matchBlockShortcut(prefix);
  return shortcut === undefined
    ? undefined
    : { ...shortcut, removePrefix: prefix.length };
}

// The slash menu feature shows the menu; the editor only says where the
// "/" is.
const SLASH_MENU_OVERLAY = "slash-menu";

function openSlashMenu(target: Target, dispatch: Dispatch): void {
  const overlay = {
    kind: SLASH_MENU_OVERLAY,
    anchorId: target.blockId,
    start: target.start,
  };
  dispatch(openOverlay.create({ overlay }));
}

// After a typed key, the Markdown it closes inside the line, if any.
function inlineMarkdownFor(target: Target, text: string, state: AppState) {
  const block = state.workspace.blocks[target.blockId];
  if (!isTextBlock(block) || text.length !== 1) return undefined;
  // A code block keeps what is typed in it as it is.
  if (block.type === CODE_TYPE) return undefined;
  const current = textOf(block);
  const typed =
    current.slice(0, target.start) + text + current.slice(target.end);
  return matchInlineMarkdown(typed, target.start + text.length);
}

const insert: Handler = (target, event, { state, dispatch }) => {
  const text = insertedText(event);
  const shortcut = shortcutFor(target, text, state);
  if (shortcut !== undefined) {
    dispatch(convertBlock.create({ blockId: target.blockId, ...shortcut }));
    return;
  }
  dispatch(replaceText.create({ ...target, text }));
  if (text === "/") openSlashMenu(target, dispatch);
  const markdown = inlineMarkdownFor(target, text, state);
  if (markdown !== undefined) {
    dispatch(
      applyInlineMarkdown.create({ blockId: target.blockId, ...markdown }),
    );
  }
};

const lineBreak: Handler = (target, _event, { dispatch }) => {
  dispatch(replaceText.create({ ...target, text: "\n" }));
};

const paragraph: Handler = (target, event, context) => {
  const { state, dispatch } = context;
  const type = state.workspace.blocks[target.blockId]?.type ?? "";
  if (blockDefinition(type)?.isMultiline === true) {
    lineBreak(target, event, context);
    return;
  }
  if (target.start !== target.end)
    dispatch(replaceText.create({ ...target, text: "" }));
  dispatch(
    splitBlock.create({ blockId: target.blockId, offset: target.start }),
  );
};

function remove(direction: -1 | 1): Handler {
  return (target, _event, { state, dispatch }) => {
    if (target.start !== target.end) {
      dispatch(replaceText.create({ ...target, text: "" }));
      return;
    }
    // Nothing left to delete in this block: join with its neighbor.
    const joined =
      direction === -1
        ? target.blockId
        : selectNeighborTextBlock(state, target.blockId, 1)?.id;
    if (joined !== undefined)
      dispatch(mergeBlockBackward.create({ blockId: joined }));
  };
}

function format(mark: Mark): Handler {
  return (target, _event, { dispatch }) => {
    dispatch(toggleTextMark.create({ ...target, mark }));
  };
}

function history(type: string): Handler {
  return (_target, _event, { dispatch }) => {
    dispatch({ type });
  };
}

const HANDLERS: Record<string, Handler> = {
  insertText: insert,
  insertReplacementText: insert,
  insertFromPaste: pasteInto,
  insertFromDrop: pasteInto,
  insertFromYank: pasteInto,
  insertParagraph: paragraph,
  insertLineBreak: lineBreak,
  deleteContentBackward: remove(-1),
  deleteWordBackward: remove(-1),
  deleteSoftLineBackward: remove(-1),
  deleteHardLineBackward: remove(-1),
  deleteContentForward: remove(1),
  deleteWordForward: remove(1),
  deleteSoftLineForward: remove(1),
  deleteHardLineForward: remove(1),
  deleteByCut: remove(-1),
  deleteByDrag: remove(-1),
  deleteContent: remove(-1),
  formatBold: format("bold"),
  formatItalic: format("italic"),
  formatUnderline: format("underline"),
  formatStrikeThrough: format("strikethrough"),
  historyUndo: history(UNDO_COMMAND),
  historyRedo: history(REDO_COMMAND),
};

// Input the browser will not let the app cancel is left to the browser and
// read back afterwards (see reconcileText).
function isBrowserOwned(event: InputEvent): boolean {
  return event.isComposing || event.inputType.includes("Composition");
}

// Form fields inside a block, such as an image caption, edit themselves.
function isFormField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  );
}

export function onBeforeInput(event: InputEvent, context: InputContext): void {
  if (isBrowserOwned(event) || !event.cancelable) return;
  if (isFormField(event.target)) return;
  event.preventDefault();
  const target = targetOf(event);
  if (target !== undefined) HANDLERS[event.inputType]?.(target, event, context);
}

// After the browser has edited a block itself (composition, spellcheck,
// autocorrect), finds what changed and records it as one command.
export function reconcileText(
  node: EventTarget | null,
  context: InputContext,
): void {
  const element = textElementOf(node instanceof Node ? node : null);
  const blockId = blockIdOf(element);
  const block =
    blockId === undefined ? undefined : context.state.workspace.blocks[blockId];
  if (element === null || !isTextBlock(block)) return;
  const edit = diffText(textOf(block), element.textContent);
  if (edit === undefined) return;
  context.dispatch(replaceText.create({ blockId: block.id, ...edit }));
}
