// Reads pasted HTML as lines of rich text. The HTML is parsed into a
// document of its own that never runs or loads anything, and only its text
// and the supported marks are taken from it. Nothing pasted reaches the
// page as HTML.
import {
  concatRichText,
  plainText,
  safeHref,
  type Mark,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";

const LINE_TAGS =
  "ADDRESS ARTICLE ASIDE BLOCKQUOTE BR DD DIV DL DT FOOTER H1 H2 H3 H4 H5 H6 HEADER HR LI MAIN OL P PRE SECTION TABLE TD TH TR UL";
const SKIPPED_TAGS = "HEAD NOSCRIPT SCRIPT STYLE TEMPLATE TITLE";
const STARTS_LINE = new Set(LINE_TAGS.split(" "));
const SKIPPED = new Set(SKIPPED_TAGS.split(" "));
const TAG_MARKS: Record<string, Mark> = {
  B: "bold",
  STRONG: "bold",
  I: "italic",
  EM: "italic",
  CODE: "code",
  KBD: "code",
  SAMP: "code",
  TT: "code",
  U: "underline",
  INS: "underline",
  S: "strikethrough",
  STRIKE: "strikethrough",
  DEL: "strikethrough",
};
const BOLD_FROM = 600;

interface Style {
  readonly marks: readonly Mark[];
  readonly href: string | undefined;
  // Inside preformatted text, spaces and line breaks are kept.
  readonly isPreformatted: boolean;
}

function withMark(marks: readonly Mark[], mark: Mark, isOn: boolean): Mark[] {
  const others = marks.filter((item) => item !== mark);
  return isOn ? [...others, mark] : others;
}

// Editors often write bold and italic as inline styles, and some wrap
// everything in a bold tag that an inline style then turns off.
function styledMarks(element: HTMLElement, marks: readonly Mark[]): Mark[] {
  const { fontWeight, fontStyle } = element.style;
  const weight = fontWeight === "bold" ? BOLD_FROM : Number(fontWeight);
  const tagMark = TAG_MARKS[element.tagName];
  let next =
    tagMark === undefined ? [...marks] : withMark(marks, tagMark, true);
  if (fontWeight !== "" && (fontWeight === "normal" || !Number.isNaN(weight)))
    next = withMark(next, "bold", weight >= BOLD_FROM);
  if (fontStyle !== "") next = withMark(next, "italic", fontStyle === "italic");
  return next;
}

function styleOf(element: HTMLElement, inherited: Style): Style {
  const link =
    element.tagName === "A"
      ? safeHref(element.getAttribute("href") ?? "")
      : undefined;
  return {
    marks: styledMarks(element, inherited.marks),
    href: link ?? inherited.href,
    isPreformatted: inherited.isPreformatted || element.tagName === "PRE",
  };
}

function spanOf(text: string, style: Style): TextSpan {
  const span: TextSpan = { text: text.normalize("NFC") };
  if (style.marks.length > 0) span.marks = [...style.marks];
  if (style.href !== undefined) span.href = style.href;
  return span;
}

function addText(text: string, style: Style, lines: TextSpan[][]): void {
  const pieces = style.isPreformatted
    ? text.split(/\r\n?|\n/)
    : [text.replace(/\s+/g, " ")];
  pieces.forEach((piece, index) => {
    if (index > 0) lines.push([]);
    lines.at(-1)?.push(spanOf(piece, style));
  });
}

function walk(node: Node, style: Style, lines: TextSpan[][]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    addText(node.textContent ?? "", style, lines);
    return;
  }
  if (!(node instanceof HTMLElement) || SKIPPED.has(node.tagName)) return;
  const startsLine = STARTS_LINE.has(node.tagName);
  if (startsLine) lines.push([]);
  const next = styleOf(node, style);
  node.childNodes.forEach((child) => {
    walk(child, next, lines);
  });
  if (startsLine) lines.push([]);
}

// Spaces at the edges of a line are layout, not content.
function trimLine(spans: readonly TextSpan[]): RichText {
  const line = concatRichText([...spans], []);
  const first = line[0];
  if (first !== undefined) line[0] = { ...first, text: first.text.trimStart() };
  const last = line.at(-1);
  if (last !== undefined)
    line[line.length - 1] = { ...last, text: last.text.trimEnd() };
  return concatRichText(line, []);
}

// The lines of text in a piece of pasted HTML, without the empty ones.
export function parsePastedHtml(html: string): RichText[] {
  const { body } = new DOMParser().parseFromString(html, "text/html");
  const lines: TextSpan[][] = [[]];
  walk(body, { marks: [], href: undefined, isPreformatted: false }, lines);
  return lines.map(trimLine).filter((line) => plainText(line) !== "");
}

// The inline content of some nodes as one rich text, its lines joined by
// line breaks.
export function richTextOf(nodes: readonly Node[]): RichText {
  const lines: TextSpan[][] = [[]];
  const style = { marks: [], href: undefined, isPreformatted: false };
  for (const node of nodes) walk(node, style, lines);
  const kept = lines.map(trimLine).filter((line) => plainText(line) !== "");
  const breakLine: RichText = [{ text: "\n" }];
  return kept.reduce<RichText>(
    (text, line, index) =>
      concatRichText(
        index === 0 ? text : concatRichText(text, breakLine),
        line,
      ),
    [],
  );
}
