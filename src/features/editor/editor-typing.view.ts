// What a typed key does besides adding its text: a space after a block
// prefix converts the block; "/", "@" and "[[" open their menus, which
// their own features show; a closing marker formats inline Markdown.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { CODE_TYPE } from "../../blocks/code/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { matchInlineMarkdown } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { matchBlockShortcut } from "./block-shortcut.ts";
import type { InputContext, Target } from "./editor-input.view.ts";
import { applyInlineMarkdown } from "./editor.commands.ts";

// A space after a shortcut at the start of a paragraph converts the
// paragraph instead of being typed.
export function shortcutFor(target: Target, text: string, state: AppState) {
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

// The menus' features show them; the editor only says where the "/", the
// "@" or the "[[" is.
const SLASH_MENU_OVERLAY = "slash-menu";
const MENTION_MENU_OVERLAY = "mention-menu";
const PAGE_LINK_MENU_OVERLAY = "page-link-menu";
const EMOJI_MENU_OVERLAY = "emoji-menu";

// The key that opens a menu at once.
const MENU_KEYS: Readonly<Record<string, string>> = {
  "/": SLASH_MENU_OVERLAY,
  "@": MENTION_MENU_OVERLAY,
  ":": EMOJI_MENU_OVERLAY,
};

function openMenu(target: Target, kind: string, dispatch: Dispatch): void {
  const overlay = { kind, anchorId: target.blockId, start: target.start };
  dispatch(openOverlay.create({ overlay }));
}

// "/" and "@" open their menu at once; "[" does after another "[".
function menuFor(target: Target, text: string, state: AppState) {
  const kind = MENU_KEYS[text];
  if (kind !== undefined) return { kind, start: target.start };
  const block = state.workspace.blocks[target.blockId];
  if (text !== "[" || !isTextBlock(block)) return undefined;
  const isSecond = textOf(block)[target.start - 1] === "[";
  return isSecond
    ? { kind: PAGE_LINK_MENU_OVERLAY, start: target.start - 1 }
    : undefined;
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

export function afterTyping(
  target: Target,
  text: string,
  { state, dispatch }: InputContext,
): void {
  const menu = menuFor(target, text, state);
  if (menu !== undefined) {
    openMenu({ ...target, start: menu.start }, menu.kind, dispatch);
  }
  const markdown = inlineMarkdownFor(target, text, state);
  if (markdown !== undefined) {
    dispatch(
      applyInlineMarkdown.create({ blockId: target.blockId, ...markdown }),
    );
  }
}
