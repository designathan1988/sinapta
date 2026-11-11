// Markdown typed inside a line: when the closing marker of **bold**,
// *italic*, _italic_, `code`, ~strike~ or ~~strike~~ is typed, the text
// between the markers takes the mark and the markers go.
import {
  deleteRange,
  plainText,
  splitRichText,
  toggleMark,
  type Mark,
} from "./rich-text.ts";
import type { RichText } from "./rich-text.schema.ts";

export interface InlineMarkdownMatch {
  // The opening marker's first character.
  readonly start: number;
  // Just after the closing marker: where the caret is.
  readonly end: number;
  readonly markerLength: number;
  readonly mark: Mark;
}

interface Marker {
  readonly marker: string;
  readonly mark: Mark;
  // An underscore inside a word, as in snake_case, is not a marker.
  readonly needsWordBoundary: boolean;
}

// Two-character markers first, so ** is not read as two *.
const MARKERS: readonly Marker[] = [
  { marker: "**", mark: "bold", needsWordBoundary: false },
  { marker: "~~", mark: "strikethrough", needsWordBoundary: false },
  { marker: "*", mark: "italic", needsWordBoundary: false },
  { marker: "_", mark: "italic", needsWordBoundary: true },
  { marker: "~", mark: "strikethrough", needsWordBoundary: false },
  { marker: "`", mark: "code", needsWordBoundary: false },
];

const SPACE = /\s/;

function isSpace(character: string | undefined): boolean {
  return character !== undefined && SPACE.test(character);
}

// The opening marker must touch the text after it, and must not be part
// of a longer run of the same character, or of a word when it needs to
// stand apart.
function isOpening(text: string, start: number, spec: Marker): boolean {
  const before = text[start - 1];
  if (isSpace(text[start + spec.marker.length])) return false;
  if (before === spec.marker[0]) return false;
  return !spec.needsWordBoundary || before === undefined || isSpace(before);
}

function matchMarker(
  text: string,
  caret: number,
  spec: Marker,
): InlineMarkdownMatch | undefined {
  const { marker, mark } = spec;
  const length = marker.length;
  const closeStart = caret - length;
  if (closeStart < 1 || text.slice(closeStart, caret) !== marker) return;
  const beforeClose = text[closeStart - 1];
  if (isSpace(beforeClose) || beforeClose === marker[0]) return;
  const start = text.lastIndexOf(marker, closeStart - length - 1);
  if (start === -1 || !isOpening(text, start, spec)) return;
  return { start, end: caret, markerLength: length, mark };
}

// The formatting the text before the caret asks for, if any.
export function matchInlineMarkdown(
  text: string,
  caret: number,
): InlineMarkdownMatch | undefined {
  for (const marker of MARKERS) {
    const match = matchMarker(text, caret, marker);
    if (match !== undefined) return match;
  }
  return undefined;
}

// The text with the match applied: markers removed, the text between them
// marked. Undefined when the markers are not there, or when they sit in
// inline code, where they are meant literally.
export function applyInlineMarkdownTo(
  rich: RichText,
  match: InlineMarkdownMatch,
): RichText | undefined {
  const { start, end, markerLength: length, mark } = match;
  const plain = plainText(rich);
  const opening = plain.slice(start, start + length);
  if (opening === "" || opening !== plain.slice(end - length, end)) return;
  const [, rest] = splitRichText(rich, start);
  const [range] = splitRichText(rest, end - start);
  if (range.some((span) => span.marks?.includes("code") === true)) return;
  const unmarked = deleteRange(
    deleteRange(rich, end - length, end),
    start,
    start + length,
  );
  return toggleMark(unmarked, { start, end: end - 2 * length, mark });
}
