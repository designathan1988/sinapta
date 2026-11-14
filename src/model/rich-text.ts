// Pure editing math on RichText. Offsets are UTF-16 indices into the plain
// text and are expected to sit on grapheme boundaries (see grapheme.ts).
import type { RichText, TextSpan, Tone } from "./rich-text.schema.ts";

export type Mark = NonNullable<TextSpan["marks"]>[number];

// Marks are stored in this order so that equal sets compare equal. Marks
// added in later versions go at the end, so older text keeps its form.
const MARK_ORDER: readonly Mark[] = [
  "bold",
  "italic",
  "code",
  "underline",
  "strikethrough",
];

export function plainText(rich: RichText): string {
  return rich.map((span) => span.text).join("");
}

// A mention or an inline equation is one piece: it never joins the text
// next to it, is never half deleted, and passes nothing on to text typed
// after it.
export function isPiece(span: TextSpan): boolean {
  return span.mention !== undefined || span.equation !== undefined;
}

function sameSet<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

function hasSameLists(a: TextSpan, b: TextSpan): boolean {
  return (
    sameSet(a.marks ?? [], b.marks ?? []) &&
    sameSet(a.comments ?? [], b.comments ?? [])
  );
}

function hasSameStyle(a: TextSpan, b: TextSpan): boolean {
  if (isPiece(a) || isPiece(b)) return false;
  return (
    a.href === b.href &&
    a.color === b.color &&
    a.highlight === b.highlight &&
    a.suggestion === b.suggestion &&
    hasSameLists(a, b)
  );
}

function withText(span: TextSpan, text: string): TextSpan {
  return { ...span, text };
}

function withMarks(span: TextSpan, marks: readonly Mark[]): TextSpan {
  const ordered = MARK_ORDER.filter((mark) => marks.includes(mark));
  const plain: TextSpan = { ...span };
  delete plain.marks;
  return ordered.length === 0 ? plain : { ...plain, marks: ordered };
}

// Drops empty spans and merges neighbors with the same style, so that one
// text has exactly one representation.
function normalize(spans: readonly TextSpan[]): RichText {
  const result: TextSpan[] = [];
  for (const span of spans) {
    if (span.text === "") continue;
    const last = result.at(-1);
    if (last !== undefined && hasSameStyle(last, span)) {
      result[result.length - 1] = withText(last, last.text + span.text);
    } else {
      result.push(withMarks(span, span.marks ?? []));
    }
  }
  return result;
}

export function splitRichText(
  rich: RichText,
  offset: number,
): [RichText, RichText] {
  const before: TextSpan[] = [];
  const after: TextSpan[] = [];
  let position = 0;
  for (const span of rich) {
    const cut = Math.max(0, Math.min(offset - position, span.text.length));
    before.push(withText(span, span.text.slice(0, cut)));
    after.push(withText(span, span.text.slice(cut)));
    position += span.text.length;
  }
  return [normalize(before), normalize(after)];
}

export function concatRichText(first: RichText, second: RichText): RichText {
  return normalize([...first, ...second]);
}

// Inserted text takes the style of the text just before it, but not its
// comments, which stay on the text they were about. Text is stored in
// composed form (NFC), so the same visible text is always the same data.
export function insertText(
  rich: RichText,
  offset: number,
  text: string,
): RichText {
  const [before, after] = splitRichText(rich, offset);
  const {
    mention: _mention,
    equation: _equation,
    comments: _comments,
    suggestion: _suggestion,
    ...style
  } = before.at(-1) ?? { text: "" };
  // As Notion's, a link grows only from inside: text typed at its end is
  // plain words after it.
  const isLinkEnd = style.href !== undefined && after[0]?.href !== style.href;
  const { href: _href, ...unlinked } = style;
  const kept = isLinkEnd ? unlinked : style;
  const inserted = withText(kept, text.normalize("NFC"));
  return normalize([...before, inserted, ...after]);
}

// A range that cuts into a piece, a mention or an equation, takes the
// whole piece.
export function widenToMentions(
  rich: RichText,
  start: number,
  end: number,
): [number, number] {
  let position = 0;
  let [from, to] = [start, end];
  for (const span of rich) {
    const spanEnd = position + span.text.length;
    const isCut = isPiece(span) && from < spanEnd && to > position;
    if (isCut) [from, to] = [Math.min(from, position), Math.max(to, spanEnd)];
    position = spanEnd;
  }
  return [from, to];
}

export function deleteRange(
  rich: RichText,
  from: number,
  to: number,
): RichText {
  const [start, end] = widenToMentions(
    rich,
    Math.min(from, to),
    Math.max(from, to),
  );
  const [before] = splitRichText(rich, start);
  const [, after] = splitRichText(rich, end);
  return concatRichText(before, after);
}

export interface LinkRange {
  readonly start: number;
  readonly end: number;
  // The link target, or undefined to remove the link.
  readonly href: string | undefined;
}

export function setLink(rich: RichText, range: LinkRange): RichText {
  const { start, end, href } = range;
  if (start === end) return rich;
  const [before, rest] = splitRichText(rich, Math.min(start, end));
  const [middle, after] = splitRichText(rest, Math.abs(end - start));
  const changed = middle.map((span) => {
    const plain: TextSpan = { ...span };
    delete plain.href;
    return href === undefined ? plain : { ...plain, href };
  });
  return normalize([...before, ...changed, ...after]);
}

export interface MarkRange {
  readonly start: number;
  readonly end: number;
  readonly mark: Mark;
}

// Removes the mark when the whole range has it, otherwise adds it to the
// whole range.
export function toggleMark(rich: RichText, range: MarkRange): RichText {
  const { start, end, mark } = range;
  if (start === end) return rich;
  const [before, rest] = splitRichText(rich, Math.min(start, end));
  const [middle, after] = splitRichText(rest, Math.abs(end - start));
  const isMarked = middle.every((span) => span.marks?.includes(mark) === true);
  const changed = middle.map((span) => {
    const others = (span.marks ?? []).filter((item) => item !== mark);
    return withMarks(span, isMarked ? others : [...others, mark]);
  });
  return normalize([...before, ...changed, ...after]);
}

export interface ToneRange {
  readonly start: number;
  readonly end: number;
  readonly key: "color" | "highlight";
  // The tone to apply, or undefined to remove it.
  readonly tone: Tone | undefined;
}

// Sets the text color or the highlight of a range, keeping everything else.
export function setTone(rich: RichText, range: ToneRange): RichText {
  const { start, end, key, tone } = range;
  if (start === end) return rich;
  const [before, rest] = splitRichText(rich, Math.min(start, end));
  const [middle, after] = splitRichText(rest, Math.abs(end - start));
  const changed = middle.map((span) => withTone(span, key, tone));
  return normalize([...before, ...changed, ...after]);
}

function withTone(
  span: TextSpan,
  key: ToneRange["key"],
  tone: Tone | undefined,
): TextSpan {
  const plain: TextSpan = { ...span };
  if (key === "color") delete plain.color;
  else delete plain.highlight;
  return tone === undefined ? plain : { ...plain, [key]: tone };
}

export interface TextRange {
  readonly start: number;
  readonly end: number;
}

// Notion's Clear formatting: the range keeps its words, mentions and
// equations, and loses every mark, link, color and highlight.
export function clearFormat(rich: RichText, range: TextRange): RichText {
  const { start, end } = range;
  if (start === end) return rich;
  const [before, rest] = splitRichText(rich, Math.min(start, end));
  const [middle, after] = splitRichText(rest, Math.abs(end - start));
  const changed = middle.map((span) => {
    const plain: TextSpan = { ...span };
    delete plain.marks;
    delete plain.href;
    delete plain.color;
    delete plain.highlight;
    return plain;
  });
  return normalize([...before, ...changed, ...after]);
}
