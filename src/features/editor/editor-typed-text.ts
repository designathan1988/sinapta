// The text a typing edit leaves: the range replaced, and, right where
// inline Markdown just closed, the new text plain, as Notion's.
import type { TextBlock } from "../../blocks/index.ts";
import {
  clearFormat,
  deleteRange,
  insertText,
  type BlockId,
  type RichText,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

// A range's text replaced; text typed right where inline Markdown just
// closed is plain.
export function replaced(
  state: AppState,
  block: TextBlock,
  change: { start: number; end: number; text: string },
): { text: RichText; caret: number } {
  const { start, end } = change;
  const kept = deleteRange(block.props.text, start, end);
  const inserted = insertText(kept, start, change.text);
  const caret = start + change.text.normalize("NFC").length;
  const text = isPlainAt(state, block.id, start)
    ? clearFormat(inserted, { start, end: caret })
    : inserted;
  return { text, caret };
}

function isPlainAt(state: AppState, blockId: BlockId, offset: number): boolean {
  const caret = state.ui.selection;
  return caret?.isPlainNext === true && caret.blockId === blockId
    ? caret.focusOffset === offset
    : false;
}
