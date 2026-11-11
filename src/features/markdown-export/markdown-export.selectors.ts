// A page written as Markdown: its title and its blocks, with marks and
// links. Colors and underline have no Markdown form and are left out.
import {
  BOOKMARK_TYPE,
  type BookmarkBlock,
} from "../../blocks/bookmark/index.ts";
import { BULLETED_LIST_TYPE } from "../../blocks/bulleted-list/index.ts";
import { CALLOUT_TYPE, type CalloutBlock } from "../../blocks/callout/index.ts";
import { CODE_TYPE } from "../../blocks/code/index.ts";
import { DIVIDER_TYPE } from "../../blocks/divider/index.ts";
import { HEADING_TYPE, type HeadingBlock } from "../../blocks/heading/index.ts";
import { IMAGE_TYPE, type ImageBlock } from "../../blocks/image/index.ts";
import { NUMBERED_LIST_TYPE } from "../../blocks/numbered-list/index.ts";
import {
  PAGE_LIKE_TYPES,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import { QUOTE_TYPE } from "../../blocks/quote/index.ts";
import { TO_DO_TYPE, type ToDoBlock } from "../../blocks/to-do/index.ts";
import { isTextBlock } from "../../blocks/index.ts";
import { TOGGLE_TYPE } from "../../blocks/toggle/index.ts";
import {
  isBlockOfType,
  plainText,
  type Block,
  type BlockId,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

const MARKUP = /[\\*_`[\]~]/g;
const LIST_TYPES = [
  BULLETED_LIST_TYPE,
  NUMBERED_LIST_TYPE,
  TO_DO_TYPE,
  TOGGLE_TYPE,
];
const INDENT = "  ";

function spanToMarkdown(span: TextSpan): string {
  const marks = span.marks ?? [];
  let text = marks.includes("code")
    ? `\`${span.text}\``
    : span.text.replace(MARKUP, (character) => `\\${character}`);
  if (marks.includes("italic")) text = `*${text}*`;
  if (marks.includes("bold")) text = `**${text}**`;
  if (marks.includes("strikethrough")) text = `~~${text}~~`;
  return span.href === undefined ? text : `[${text}](${span.href})`;
}

export function richTextToMarkdown(rich: RichText): string {
  return rich.map(spanToMarkdown).join("");
}

function textOf(block: Block): string {
  return isTextBlock(block) ? richTextToMarkdown(block.props.text) : "";
}

const PREFIXES: Readonly<Record<string, (block: Block) => string>> = {
  [HEADING_TYPE]: (block) =>
    isBlockOfType<HeadingBlock>(block, HEADING_TYPE)
      ? `${"#".repeat(block.props.level)} `
      : "",
  [BULLETED_LIST_TYPE]: () => "- ",
  [TOGGLE_TYPE]: () => "- ",
  [NUMBERED_LIST_TYPE]: () => "1. ",
  [TO_DO_TYPE]: (block) =>
    isBlockOfType<ToDoBlock>(block, TO_DO_TYPE) && block.props.isChecked
      ? "- [x] "
      : "- [ ] ",
  [QUOTE_TYPE]: () => "> ",
  [CALLOUT_TYPE]: (block) =>
    isBlockOfType<CalloutBlock>(block, CALLOUT_TYPE)
      ? `> ${block.props.icon} `
      : "> ",
};

// Blocks that are not one line of text.
const WRITERS: Readonly<Record<string, (block: Block) => string[]>> = {
  [DIVIDER_TYPE]: () => ["---"],
  [CODE_TYPE]: (block) =>
    isTextBlock(block)
      ? ["```", ...plainText(block.props.text).split("\n"), "```"]
      : [],
  [IMAGE_TYPE]: (block) =>
    isBlockOfType<ImageBlock>(block, IMAGE_TYPE)
      ? [`![${block.props.caption}](${block.props.src})`]
      : [],
  [BOOKMARK_TYPE]: (block) =>
    isBlockOfType<BookmarkBlock>(block, BOOKMARK_TYPE)
      ? [`[${block.props.url}](${block.props.url})`]
      : [],
};

// Text that starts like a heading, list item or quote would be read as
// one; a backslash keeps it plain text.
const LEADING_MARKER = /^(#{1,6}(?=\s)|[-+](?=\s)|\d+(?=[.)]\s)|>)/;

function escapeLeadingMarker(text: string): string {
  return text.replace(LEADING_MARKER, (marker) =>
    /^\d/.test(marker) ? `${marker}\\` : `\\${marker}`,
  );
}

// The lines of the block itself, without its children.
function ownLines(block: Block): string[] {
  const writer = WRITERS[block.type];
  if (writer !== undefined) return writer(block);
  const prefix = PREFIXES[block.type]?.(block);
  if (prefix === undefined) return [escapeLeadingMarker(textOf(block))];
  return [`${prefix}${textOf(block)}`];
}

function blockLines(state: AppState, block: Block, depth: number): string[] {
  const indent = INDENT.repeat(depth);
  const own = ownLines(block).map((line) => `${indent}${line}`);
  const children = block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    return child === undefined ? [] : blockLines(state, child, depth + 1);
  });
  return [...own, ...children];
}

// Neighbors in the same list are written without a blank line between.
function isSameList(previous: Block | undefined, block: Block): boolean {
  return previous?.type === block.type && LIST_TYPES.includes(block.type);
}

function isWritten(block: Block | undefined): block is Block {
  if (block === undefined || PAGE_LIKE_TYPES.includes(block.type)) return false;
  return (
    ownLines(block).some((line) => line !== "") || block.childIds.length > 0
  );
}

export function selectPageMarkdown(state: AppState, pageId: BlockId): string {
  const page = selectPage(state, pageId);
  if (page === undefined) return "";
  const title = selectPageTitle(page);
  const blocks = page.childIds
    .map((id) => state.workspace.blocks[id])
    .filter(isWritten);
  const parts = blocks.map((block, index) => {
    const separator =
      index === 0 || isSameList(blocks[index - 1], block) ? "" : "\n";
    return `${separator}${blockLines(state, block, 0).join("\n")}`;
  });
  const heading = `# ${title === "" ? COPY.sidebar.untitled : title}`;
  return `${heading}\n\n${parts.join("\n")}\n`;
}

const UNSAFE_FILE_CHARACTERS = /[\\/:*?"<>|]+/g;

export function markdownFileName(title: string): string {
  const name = title
    .replace(UNSAFE_FILE_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${name === "" ? COPY.sidebar.untitled : name}.md`;
}
