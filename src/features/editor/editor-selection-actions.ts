// What keys do to the selected blocks as a whole: duplicate them, or
// select every block of the page.
import { countBlockTree } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { duplicateBlock } from "./editor-insert.commands.ts";
import { selectBlockRange } from "./editor-selection.commands.ts";
import {
  selectChildBlocks,
  selectPageIdOf,
  selectSelectedBlocks,
} from "./editor.selectors.ts";

// Each selected block whose parent is not selected too, with everything
// inside it, is copied below itself.
export function duplicateSelected(context: {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}): void {
  const blocks = selectSelectedBlocks(context.state);
  const ids = new Set(blocks.map((block) => block.id));
  for (const block of blocks) {
    if (block.parentId !== null && ids.has(block.parentId)) continue;
    const blockCount = countBlockTree(context.state.workspace, block.id);
    context.dispatch(duplicateBlock.create({ blockId: block.id, blockCount }));
  }
}

// Ctrl+A while blocks are selected selects every block of the page, as
// Notion's, instead of the browser selecting the whole window.
export function selectEveryBlock({ state, dispatch }: InputContext): void {
  const anchor = state.ui.blockSelection?.anchorId;
  const pageId =
    anchor === undefined ? undefined : selectPageIdOf(state, anchor);
  const blocks = pageId === undefined ? [] : selectChildBlocks(state, pageId);
  const first = blocks[0];
  const last = blocks.at(-1);
  if (first === undefined || last === undefined) return;
  dispatch(selectBlockRange.create({ anchorId: first.id, focusId: last.id }));
}
