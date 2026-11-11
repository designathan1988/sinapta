// Reads pasted Markdown as blocks of rich text. Only the block kinds and
// marks the editor has are read; anything else stays as plain text.
import {
  concatRichText,
  safeHref,
  type Mark,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";
import {
  hasPipeTable,
  isPipeTableAt,
  readPipeTable,
} from "./pasted-markdown-table.ts";

export type MarkdownKind =
  | "paragraph"
  | "heading"
  | "bulleted-list"
  | "numbered-list"
  | "to-do"
  | "quote"
  | "divider"
  | "code"
  | "simple-table";

export interface MarkdownBlock {
  readonly kind: MarkdownKind;
  // How deep a list item is nested; 0 for everything else.
  readonly depth: number;
  readonly text: RichText;
  readonly level?: number;
  readonly isChecked?: boolean;
  // The word after a code fence's opening marks, such as "ts".
  readonly language?: string;
  // A pipe table's cells; its first row is its header.
  readonly rows?: readonly (readonly RichText[])[];
  readonly hasHeaderRow?: boolean;
}

interface InlineRule {
  readonly pattern: RegExp;
  readonly mark?: Mark;
  readonly isLink?: boolean;
}

// Earlier rules win when two start at the same place. Code is literal.
const INLINE_RULES: readonly InlineRule[] = [
  { pattern: /`([^`]+)`/, mark: "code" },
  { pattern: /\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/, isLink: true },
  { pattern: /\*\*(.+?)\*\*/, mark: "bold" },
  { pattern: /__(.+?)__/, mark: "bold" },
  { pattern: /~~(.+?)~~/, mark: "strikethrough" },
  { pattern: /\*([^*\s](?:[^*]*[^*\s])?)\*/, mark: "italic" },
  { pattern: /(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/, mark: "italic" },
];

interface Style {
  readonly marks: readonly Mark[];
  readonly href: string | undefined;
}

function span(text: string, style: Style): TextSpan {
  const result: TextSpan = { text };
  if (style.marks.length > 0) result.marks = [...style.marks];
  if (style.href !== undefined) result.href = style.href;
  return result;
}

interface Found {
  readonly rule: InlineRule;
  readonly match: RegExpExecArray;
}

function firstMatch(text: string): Found | undefined {
  let found: Found | undefined;
  for (const rule of INLINE_RULES) {
    const match = rule.pattern.exec(text);
    if (
      match !== null &&
      (found === undefined || match.index < found.match.index)
    )
      found = { rule, match };
  }
  return found;
}

function inner(found: Found, style: Style): TextSpan[] {
  const { rule, match } = found;
  const content = match[1] ?? "";
  if (rule.isLink === true) {
    const href = safeHref(match[2] ?? "");
    return parseSpans(content, { ...style, href: href ?? style.href });
  }
  const marks =
    rule.mark === undefined ? style.marks : [...style.marks, rule.mark];
  if (rule.mark === "code") return [span(content, { ...style, marks })];
  return parseSpans(content, { ...style, marks });
}

function parseSpans(text: string, style: Style): TextSpan[] {
  const found = firstMatch(text);
  if (found === undefined) return text === "" ? [] : [span(text, style)];
  const { index } = found.match;
  const after = text.slice(index + found.match[0].length);
  return [
    ...(index > 0 ? [span(text.slice(0, index), style)] : []),
    ...inner(found, style),
    ...parseSpans(after, style),
  ];
}

export function parseInlineMarkdown(text: string): RichText {
  const spans = parseSpans(text.normalize("NFC"), {
    marks: [],
    href: undefined,
  });
  return concatRichText([], spans);
}

interface LineRule {
  readonly pattern: RegExp;
  readonly kind: MarkdownKind;
  readonly isList?: boolean;
}

const LINE_RULES: readonly LineRule[] = [
  { pattern: /^(#{1,3})\s+(.*)$/, kind: "heading" },
  { pattern: /^[-*+]\s+\[([ xX])\]\s+(.*)$/, kind: "to-do", isList: true },
  { pattern: /^(-{3,}|\*{3,}|_{3,})$/, kind: "divider" },
  { pattern: /^[-*+]\s+()(.*)$/, kind: "bulleted-list", isList: true },
  { pattern: /^\d+[.)]\s+()(.*)$/, kind: "numbered-list", isList: true },
  { pattern: /^>\s?()(.*)$/, kind: "quote" },
];
const FENCE = /^\s*```/;
const INDENT_WIDTH = 2;

function indentOf(line: string): number {
  const leading = /^[ \t]*/.exec(line)?.[0] ?? "";
  const width = leading.replace(/\t/g, "    ").length;
  return Math.floor(width / INDENT_WIDTH);
}

function blockOf(line: string): MarkdownBlock {
  const trimmed = line.trim();
  for (const rule of LINE_RULES) {
    const match = rule.pattern.exec(trimmed);
    if (match === null) continue;
    const depth = rule.isList === true ? indentOf(line) : 0;
    const text =
      rule.kind === "divider" ? [] : parseInlineMarkdown(match[2] ?? "");
    const block: MarkdownBlock = { kind: rule.kind, depth, text };
    if (rule.kind === "heading")
      return { ...block, level: match[1]?.length ?? 1 };
    if (rule.kind === "to-do") return { ...block, isChecked: match[1] !== " " };
    return block;
  }
  return { kind: "paragraph", depth: 0, text: parseInlineMarkdown(trimmed) };
}

// The lines of a fenced code block, from the line after the opening fence;
// returns the code and the index of the first line after the closing fence.
function readFence(lines: readonly string[], from: number): [string, number] {
  const body: string[] = [];
  let index = from;
  while (index < lines.length && !FENCE.test(lines[index] ?? "")) {
    body.push(lines[index] ?? "");
    index += 1;
  }
  return [body.join("\n"), index + 1];
}

type Read = readonly [MarkdownBlock, number];

// A code block from its fence to the closing fence.
function fencedBlock(lines: readonly string[], index: number): Read {
  const line = lines[index] ?? "";
  const [code, next] = readFence(lines, index + 1);
  const language = line.trim().slice(3).trim();
  const block: MarkdownBlock = {
    kind: "code",
    depth: 0,
    text: code === "" ? [] : [{ text: code }],
    ...(language !== "" && { language }),
  };
  return [block, next];
}

function tableBlock(lines: readonly string[], index: number): Read {
  const { cells, next } = readPipeTable(lines, index);
  const rows = cells.map((row) => row.map(parseInlineMarkdown));
  const block: MarkdownBlock = {
    kind: "simple-table",
    depth: 0,
    text: [],
    hasHeaderRow: true,
    rows,
  };
  return [block, next];
}

// A block that spans lines starting at the index, if one does.
function spanningBlock(
  lines: readonly string[],
  index: number,
): Read | undefined {
  if (FENCE.test(lines[index] ?? "")) return fencedBlock(lines, index);
  return isPipeTableAt(lines, index) ? tableBlock(lines, index) : undefined;
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const read = spanningBlock(lines, index);
    if (read !== undefined) {
      blocks.push(read[0]);
      index = read[1];
      continue;
    }
    const line = lines[index] ?? "";
    if (line.trim() !== "") blocks.push(blockOf(line));
    index += 1;
  }
  return blocks;
}

// True when the text uses a Markdown block marker on any line, so it is
// read as blocks rather than as lines of text.
export function hasMarkdownBlocks(text: string): boolean {
  const lines = text.split(/\r\n?|\n/);
  const hasMarker = lines.some(
    (line) =>
      FENCE.test(line) ||
      LINE_RULES.some((rule) => rule.pattern.test(line.trim())),
  );
  return hasMarker || hasPipeTable(lines);
}
