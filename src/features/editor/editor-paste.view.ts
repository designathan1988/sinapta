// Turns what is pasted or dropped into a block into a command. Pasted HTML
// is read for its text and marks only; see src/ui/rich-text/.
import { blockDefinition } from "../../blocks/block-registry.ts";
import type { BlockId, RichText } from "../../model/index.ts";
import { parsePastedHtml } from "../../ui/rich-text/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { pasteLines } from "./editor-paste.commands.ts";
import { replaceText } from "./editor.commands.ts";

export interface PasteTarget {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

function plainLines(text: string): RichText[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => [{ text: line.normalize("NFC") }]);
}

function plainTextOf(event: InputEvent): string {
  const text = event.data ?? event.dataTransfer?.getData("text/plain") ?? "";
  return text.replace(/\r\n?/g, "\n");
}

function linesOf(event: InputEvent): RichText[] {
  const html = event.dataTransfer?.getData("text/html") ?? "";
  return html === "" ? plainLines(plainTextOf(event)) : parsePastedHtml(html);
}

// A block that keeps line breaks itself, such as code, takes the plain
// text as it is. Any other block gets one block per pasted line.
export function pasteInto(
  target: PasteTarget,
  event: InputEvent,
  context: InputContext,
): void {
  const { state, dispatch } = context;
  const type = state.workspace.blocks[target.blockId]?.type ?? "";
  if (blockDefinition(type)?.isMultiline === true) {
    dispatch(replaceText.create({ ...target, text: plainTextOf(event) }));
    return;
  }
  const lines = linesOf(event);
  if (lines.length > 0) dispatch(pasteLines.create({ ...target, lines }));
}
