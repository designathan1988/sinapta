// The line the slash menu was opened on, as Notion marks it while the
// menu is open: washed, and "Type to search" after the "/" until a word
// follows it. The slash menu's overlay kind is declared here, where the
// editor draws its line; the slash menu feature opens it.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import type { Block } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

export const SLASH_MENU_OVERLAY = "slash-menu";

export interface SlashLine {
  // True while nothing is typed after the "/".
  readonly isEmpty: boolean;
}

export function selectSlashLine(
  state: AppState,
  block: Block,
): SlashLine | undefined {
  const { overlay, selection } = state.ui;
  if (overlay?.kind !== SLASH_MENU_OVERLAY || overlay.anchorId !== block.id)
    return undefined;
  if (!isTextBlock(block)) return undefined;
  const start = overlay.start ?? -1;
  const text = textOf(block);
  if (text[start] !== "/") return undefined;
  const end =
    selection?.blockId === block.id ? selection.focusOffset : start + 1;
  return { isEmpty: text.slice(start + 1, Math.max(end, start + 1)) === "" };
}
