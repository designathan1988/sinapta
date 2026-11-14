// Turns what is pasted or dropped into a block into a command. Pasted HTML
// is read for its text and marks only, and pasted Markdown for its blocks
// and marks; see src/ui/rich-text/.
import { blockDefinition } from "../../blocks/index.ts";
import {
  BLOCK_CLIPBOARD_TYPE,
  graphemeCount,
  parseBlockClipboard,
  safeHref,
  type BlockId,
  type RichText,
} from "../../model/index.ts";
import {
  hasMarkdownBlocks,
  parseInlineMarkdown,
  parseMarkdownBlocks,
  parsePastedHtml,
  parsePastedHtmlBlocks,
  type PastedBlock,
} from "../../ui/rich-text/index.ts";
import type { AppState } from "../../state/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { pasteBlocks } from "./editor-paste-blocks.commands.ts";
import { openPasteAs } from "./editor-paste-as.view.ts";
import { pasteLines } from "./editor-paste.commands.ts";
import { replaceText, setTextLink } from "./editor.commands.ts";

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

// A paste carries its text on the clipboard; some engines give it empty
// data rather than none.
function plainTextOf(event: InputEvent): string {
  const data = event.data ?? "";
  const text =
    data === "" ? (event.dataTransfer?.getData("text/plain") ?? "") : data;
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
const STRUCTURED_HTML = /<(h[1-6]|li|blockquote|pre|table|img|hr)[\s>]/i;

function isMarkdownPaste(event: InputEvent): boolean {
  if (STRUCTURED_HTML.test(htmlOf(event))) return false;
  return hasMarkdownBlocks(plainTextOf(event));
}

// Blocks copied in Pagecraft, of the types this app has: from the
// clipboard's own type, or kept by Ctrl+C when the pasted text is theirs.
function copiedBlocks(
  event: InputEvent,
  state: AppState,
): readonly PastedBlock[] | undefined {
  const kept = state.ui.clipboard;
  if (kept !== null && kept.text === plainTextOf(event)) return kept.blocks;
  const text = event.dataTransfer?.getData(BLOCK_CLIPBOARD_TYPE) ?? "";
  if (text === "") return undefined;
  return parseBlockClipboard(text)?.filter((block) => {
    const definition = blockDefinition(block.kind);
    return definition?.label !== undefined;
  });
}

// The blocks a paste stands for, when it has any: blocks copied in
// Pagecraft, HTML with headings, lists, quotes, code, tables or images, or
// Markdown with block syntax.
function pastedBlocks(
  event: InputEvent,
  state: AppState,
): readonly PastedBlock[] | undefined {
  const copied = copiedBlocks(event, state);
  if (copied !== undefined) return copied;
  const html = htmlOf(event);
  if (STRUCTURED_HTML.test(html)) return parsePastedHtmlBlocks(html);
  if (isMarkdownPaste(event)) return parseMarkdownBlocks(plainTextOf(event));
  return undefined;
}

// A single web or mail address, as it was pasted and as a safe link.
function addressOf(event: InputEvent) {
  const text = plainTextOf(event).trim();
  if (text === "" || /\s/.test(text) || STRUCTURED_HTML.test(htmlOf(event))) {
    return undefined;
  }
  const href = safeHref(text);
  return href === undefined ? undefined : { text, href };
}

// An address pasted over selected text links that text; pasted anywhere
// else it becomes a link that shows the address, and a web address opens
// Notion's "Paste as" menu under it.
function pasteAddress(
  target: PasteTarget,
  address: { text: string; href: string },
  dispatch: InputContext["dispatch"],
): void {
  if (target.start !== target.end) {
    dispatch(setTextLink.create({ ...target, href: address.text }));
    return;
  }
  const lines = [[{ text: address.text, href: address.href }]];
  dispatch(pasteLines.create({ ...target, lines }));
  if (!address.href.startsWith("http")) return;
  const end = target.start + graphemeCount(address.text);
  openPasteAs({ ...target, end, href: address.href }, dispatch);
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
  const address = addressOf(event);
  if (address !== undefined) {
    pasteAddress(target, address, dispatch);
    return;
  }
  const blocks = pastedBlocks(event, state);
  if (blocks !== undefined && blocks.length > 0) {
    dispatch(pasteBlocks.create({ blockId: target.blockId, blocks }));
    return;
  }
  const lines = linesOf(event);
  if (lines.length > 0) dispatch(pasteLines.create({ ...target, lines }));
}
