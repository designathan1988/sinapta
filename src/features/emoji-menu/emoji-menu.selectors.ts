// The emoji offered for ":name" typed in a block's text: two letters at
// least, no space, as Notion does.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { searchEmoji, type Emoji } from "../../ui/emoji/index.ts";

export const EMOJI_MENU_OVERLAY = "emoji-menu";

const LIMIT = 8;
const MIN_LETTERS = 2;

export interface OpenEmojiMenu {
  readonly blockId: BlockId;
  // Offsets of the ":" and of the caret in the block's text.
  readonly start: number;
  readonly end: number;
  readonly items: readonly Emoji[];
  readonly activeIndex: number;
}

// The text block the menu was opened in, while the caret is in it.
function menuBlock(state: AppState) {
  const { overlay, selection } = state.ui;
  if (overlay?.kind !== EMOJI_MENU_OVERLAY || selection === null) return;
  const block = state.workspace.blocks[selection.blockId];
  if (!isTextBlock(block) || block.id !== overlay.anchorId) return;
  return { block, start: overlay.start ?? -1, end: selection.focusOffset };
}

// The name typed after the colon, while the colon is still there and the
// caret after it.
function typedName(state: AppState) {
  const found = menuBlock(state);
  if (found === undefined) return;
  const { block, start, end } = found;
  const text = textOf(block);
  if (text[start] !== ":" || end <= start) return;
  const name = text.slice(start + 1, end);
  if (name.length < MIN_LETTERS || /\s/.test(name)) return;
  return { blockId: block.id, start, end, name };
}

export function selectOpenEmojiMenu(
  state: AppState,
): OpenEmojiMenu | undefined {
  const typed = typedName(state);
  if (typed === undefined) return undefined;
  const items = searchEmoji(typed.name, LIMIT);
  if (items.length === 0) return undefined;
  const activeIndex = Math.min(
    state.ui.overlay?.activeIndex ?? 0,
    items.length - 1,
  );
  const { blockId, start, end } = typed;
  return { blockId, start, end, items, activeIndex };
}
