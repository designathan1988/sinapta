// What a typed key does besides adding its text: a space after a block
// prefix converts the block; "/", "@", "[[" and "+" open their menus, which
// their own features show; a closing marker formats inline Markdown.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { BULLETED_LIST_TYPE } from "../../blocks/bulleted-list/index.ts";
import { CODE_TYPE } from "../../blocks/code/index.ts";
import { DIVIDER_TYPE } from "../../blocks/divider/index.ts";
import { HEADING_TYPE } from "../../blocks/heading/index.ts";
import { NUMBERED_LIST_TYPE } from "../../blocks/numbered-list/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import { QUOTE_TYPE } from "../../blocks/quote/index.ts";
import { TO_DO_TYPE } from "../../blocks/to-do/index.ts";
import { TOGGLE_TYPE } from "../../blocks/toggle/index.ts";
import { matchInlineMarkdown, type Block } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { matchBlockShortcut, type BlockShortcut } from "./block-shortcut.ts";
import type { InputContext, Target } from "./editor-input.view.ts";
import { applyInlineMarkdown } from "./editor.commands.ts";

// A space after a shortcut at the start of a text block converts the block
// instead of being typed: a paragraph, and as Notion's a list item, a
// to-do, a toggle, a quote or a heading ("[] " in a bullet makes a to-do).
const TURNS: ReadonlySet<string> = new Set([
  PARAGRAPH_TYPE,
  BULLETED_LIST_TYPE,
  NUMBERED_LIST_TYPE,
  TO_DO_TYPE,
  TOGGLE_TYPE,
  QUOTE_TYPE,
  HEADING_TYPE,
]);

// The prefix of the block's own kind is typed as it is, as "- " in a
// bullet; a heading's prefix of another level still changes it.
function isOwnKind(shortcut: BlockShortcut, block: Block): boolean {
  return (
    shortcut.blockType === block.type &&
    shortcut.extraProps?.level === block.props.level
  );
}

// As Notion's, the third dash of "---" alone on a line makes a divider at
// once, with no space after it.
function isDividerDash(target: Target, text: string, block: Block): boolean {
  return (
    text === "-" &&
    block.type === PARAGRAPH_TYPE &&
    isTextBlock(block) &&
    textOf(block) === "--" &&
    target.start === 2 &&
    target.end === 2
  );
}

export function shortcutFor(target: Target, text: string, state: AppState) {
  const block = state.workspace.blocks[target.blockId];
  if (block !== undefined && isDividerDash(target, text, block)) {
    return { blockType: DIVIDER_TYPE, removePrefix: 2 };
  }
  const isTyped = text === " " && target.start === target.end;
  if (!isTyped || !isTextBlock(block) || !TURNS.has(block.type)) {
    return undefined;
  }
  const prefix = textOf(block).slice(0, target.start);
  const shortcut = matchBlockShortcut(prefix);
  return shortcut === undefined || isOwnKind(shortcut, block)
    ? undefined
    : { ...shortcut, removePrefix: prefix.length };
}

// The menus' features show them; the editor only says where the "/", the
// "@", the "[[" or the "+" is.
const SLASH_MENU_OVERLAY = "slash-menu";
const MENTION_MENU_OVERLAY = "mention-menu";
const PAGE_LINK_MENU_OVERLAY = "page-link-menu";
const EMOJI_MENU_OVERLAY = "emoji-menu";
const PLUS_MENU_OVERLAY = "page-plus-menu";

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

// "/" and "@" open their menu at once; "[" does after another "[", and
// "+" at a word's start.
function menuFor(target: Target, text: string, state: AppState) {
  const kind = MENU_KEYS[text];
  if (kind !== undefined) return { kind, start: target.start };
  const block = state.workspace.blocks[target.blockId];
  if (!isTextBlock(block)) return undefined;
  const before = textOf(block)[target.start - 1];
  const isWordStart = before === undefined || /\s/.test(before);
  if (text === "+" && isWordStart && block.type !== CODE_TYPE) {
    return { kind: PLUS_MENU_OVERLAY, start: target.start };
  }
  if (text !== "[") return undefined;
  const isSecond = before === "[";
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
