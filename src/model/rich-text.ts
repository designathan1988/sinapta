// Pure editing math on RichText. Offsets are UTF-16 indices into the plain
// text and are expected to sit on grapheme boundaries (see grapheme.ts).
import type { RichText, TextSpan } from "./rich-text.schema.ts";

export type Mark = NonNullable<TextSpan["marks"]>[number];

// Marks are stored in this order so that equal sets compare equal.
const MARK_ORDER: readonly Mark[] = ["bold", "italic", "code"];

export function plainText(rich: RichText): string {
  return rich.map((span) => span.text).join("");
}

function hasSameStyle(a: TextSpan, b: TextSpan): boolean {
  const marksA = a.marks ?? [];
  const marksB = b.marks ?? [];
  return (
    a.href === b.href &&
    marksA.length === marksB.length &&
    marksA.every((mark) => marksB.includes(mark))
  );
}

function withText(span: TextSpan, text: string): TextSpan {
  return { ...span, text };
}

function withMarks(span: TextSpan, marks: readonly Mark[]): TextSpan {
  const ordered = MARK_ORDER.filter((mark) => marks.includes(mark));
  const plain: TextSpan = { text: span.text };
  if (span.href !== undefined) plain.href = span.href;
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

// Inserted text takes the style of the text just before it. Text is stored
// in composed form (NFC), so the same visible text is always the same data.
export function insertText(
  rich: RichText,
  offset: number,
  text: string,
): RichText {
  const [before, after] = splitRichText(rich, offset);
  const previous = before.at(-1);
  const inserted = withText(previous ?? { text: "" }, text.normalize("NFC"));
  return normalize([...before, inserted, ...after]);
}

export function deleteRange(
  rich: RichText,
  from: number,
  to: number,
): RichText {
  const [before] = splitRichText(rich, Math.min(from, to));
  const [, after] = splitRichText(rich, Math.max(from, to));
  return concatRichText(before, after);
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
