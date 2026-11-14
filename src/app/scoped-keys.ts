// Keys that apply while one part of the interface is active: an open
// menu, the formatting toolbar, selected rows.
import { rowSelectionKeys } from "../features/database/index.ts";
import { emojiMenuKeys } from "../features/emoji-menu/index.ts";
import { formatToolbarKeys } from "../features/format-toolbar/index.ts";
import { mentionMenuKeys } from "../features/mention-menu/index.ts";
import { slashMenuKeys } from "../features/slash-menu/index.ts";

export const SCOPED_KEYS = [
  slashMenuKeys,
  mentionMenuKeys,
  emojiMenuKeys,
  formatToolbarKeys,
  rowSelectionKeys,
];
