// Mentions in a block's text: a click on a page mention opens the page,
// and Backspace or Delete next to a mention deletes all of it. Browsers
// send no input event for deleting a piece the caret cannot enter, so the
// key itself is handled.
import { isTextBlock } from "../../blocks/index.ts";
import { isInMention, parseBlockId } from "../../model/index.ts";
import { setActivePage, type Dispatch } from "../../state/index.ts";
import { readSelection } from "../../ui/caret/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { replaceText } from "./editor.commands.ts";

export function onMentionClick(event: Event, dispatch: Dispatch): void {
  if (!(event.target instanceof Element)) return;
  const mention = event.target.closest<HTMLElement>(".mention[data-page-id]");
  const pageId = parseBlockId(mention?.dataset.pageId ?? "");
  if (pageId === undefined) return;
  event.preventDefault();
  dispatch(setActivePage.create({ pageId }));
}

const STEPS: Readonly<Record<string, -1 | 1>> = { Backspace: -1, Delete: 1 };

export function deleteMentionByKey(
  event: KeyboardEvent,
  { state, dispatch }: InputContext,
): boolean {
  const step = STEPS[event.key];
  const selection = readSelection();
  const hasMod = event.ctrlKey || event.metaKey || event.altKey;
  if (step === undefined || selection === null || hasMod) return false;
  if (selection.anchorOffset !== selection.focusOffset) return false;
  const block = state.workspace.blocks[selection.blockId];
  const caret = selection.focusOffset;
  const offset = step === -1 ? caret - 1 : caret;
  if (!isTextBlock(block) || !isInMention(block.props.text, offset)) {
    return false;
  }
  const { blockId } = selection;
  dispatch(
    replaceText.create({ blockId, start: offset, end: offset + 1, text: "" }),
  );
  return true;
}
