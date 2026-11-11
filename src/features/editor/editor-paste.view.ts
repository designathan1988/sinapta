// Turns what is pasted or dropped into a block into a command. Pasted HTML
// is read for its text and marks only, and pasted Markdown for its blocks
// and marks; see src/ui/rich-text/.
import { blockDefinition } from "../../blocks/index.ts";
import type { BlockId, RichText } from "../../model/index.ts";
import {
  hasMarkdownBlocks,
  parseInlineMarkdown,
  parseMarkdownBlocks,
  parsePastedHtml,
} from "../../ui/rich-text/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { pasteBlocks } from "./editor-paste-blocks.commands.ts";
import { pasteLines } from "./editor-paste.commands.ts";
import { replaceText } from "./editor.commands.ts";

export interface PasteTarget {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
}

// Plain lines keep their inline Markdown as marks: **bold**, `code`.
function plainLines(text: string): RichText[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(parseInlineMarkdown);
}

function plainTextOf(event: InputEvent): string {
  const text = event.data ?? event.dataTransfer?.getData("text/plain") ?? "";
  return text.replace(/\r\n?/g, "\n");
}

function htmlOf(event: InputEvent): string {
  return event.dataTransfer?.getData("text/html") ?? "";
}

function linesOf(event: InputEvent): RichText[] {
  const html = htmlOf(event);
  return html === "" ? plainLines(plainTextOf(event)) : parsePastedHtml(html);
}

// HTML that already has headings or lists says more than the plain text.
// Editors of Markdown files copy HTML without them, so their plain text,
// read as Markdown, is the better source.
const STRUCTURED_HTML = /<(h[1-6]|li|blockquote|pre|table)[\s>]/i;

function isMarkdownPaste(event: InputEvent): boolean {
  if (STRUCTURED_HTML.test(htmlOf(event))) return false;
  return hasMarkdownBlocks(plainTextOf(event));
}

// A block that keeps line breaks itself, such as code, takes the plain
// text as it is. Markdown becomes blocks of its kinds. Any other text
// gets one block per pasted line.
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
  if (isMarkdownPaste(event)) {
    const blocks = parseMarkdownBlocks(plainTextOf(event));
    dispatch(pasteBlocks.create({ blockId: target.blockId, blocks }));
    return;
  }
  const lines = linesOf(event);
  if (lines.length > 0) dispatch(pasteLines.create({ ...target, lines }));
}
