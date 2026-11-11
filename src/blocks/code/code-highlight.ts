// Paints a code block's tokens with the CSS Custom Highlight API: one
// named highlight per token kind, holding ranges over the block's text
// nodes. The editable DOM is never changed (design decision D5).
import { plainText, type RichText } from "../../model/index.ts";
import type { TokenKind } from "./code-grammar.ts";
import { tokenize, type Token } from "./code-tokenize.ts";
import type { CodeLanguage } from "./code.schema.ts";

const KINDS: readonly TokenKind[] = [
  "keyword",
  "string",
  "number",
  "comment",
  "function",
  "punctuation",
];

export interface CodePaint {
  readonly language: CodeLanguage;
  readonly text: RichText;
}

// What each block's text element was last painted with. Text in the store
// is never edited in place, so the same text reference means the same
// text, and an unchanged block costs one lookup per render.
const painted = new WeakMap<Element, CodePaint>();

function supportsHighlights(): boolean {
  return (
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof Highlight !== "undefined" &&
    typeof StaticRange !== "undefined"
  );
}

function highlightFor(kind: TokenKind): Highlight {
  const name = `code-${kind}`;
  const existing = CSS.highlights.get(name);
  if (existing !== undefined) return existing;
  const created = new Highlight();
  CSS.highlights.set(name, created);
  return created;
}

// Ranges inside this element, or over text that left the page, go.
function erase(element: Element, highlights: readonly Highlight[]): void {
  for (const highlight of highlights) {
    for (const range of highlight) {
      const node = range.startContainer;
      if (!node.isConnected || element.contains(node)) highlight.delete(range);
    }
  }
}

interface TextPiece {
  readonly node: Text;
  readonly start: number;
}

// The element's text nodes with the offset each starts at.
function textPieces(element: Element): TextPiece[] {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const pieces: TextPiece[] = [];
  let start = 0;
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (!(node instanceof Text)) continue;
    pieces.push({ node, start });
    start += node.length;
  }
  return pieces;
}

// The text node and offset of a text offset; pieces are in order.
function pointAt(pieces: readonly TextPiece[], offset: number, from: number) {
  let index = from;
  while (index + 1 < pieces.length) {
    const next = pieces[index + 1];
    if (next === undefined || next.start > offset) break;
    index += 1;
  }
  const piece = pieces[index];
  return piece === undefined
    ? undefined
    : { index, node: piece.node, offset: offset - piece.start };
}

function rangesOf(element: Element, tokens: readonly Token[]) {
  const pieces = textPieces(element);
  const ranges: { kind: TokenKind; range: StaticRange }[] = [];
  let from = 0;
  for (const token of tokens) {
    const start = pointAt(pieces, token.start, from);
    const end = start && pointAt(pieces, token.end, start.index);
    if (start === undefined || end === undefined) continue;
    from = start.index;
    const range = new StaticRange({
      startContainer: start.node,
      startOffset: start.offset,
      endContainer: end.node,
      endOffset: end.offset,
    });
    ranges.push({ kind: token.kind, range });
  }
  return ranges;
}

// Paints the block's text, unless it already shows this paint.
export function paintCode(element: Element, paint: CodePaint): void {
  if (!supportsHighlights()) return;
  const text = element.querySelector("[data-text]") ?? element;
  const last = painted.get(text);
  if (last?.text === paint.text && last.language === paint.language) return;
  painted.set(text, paint);
  const highlights = KINDS.map(highlightFor);
  erase(text, highlights);
  const tokens = tokenize(paint.language, plainText(paint.text));
  for (const { kind, range } of rangesOf(text, tokens)) {
    highlightFor(kind).add(range);
  }
}
