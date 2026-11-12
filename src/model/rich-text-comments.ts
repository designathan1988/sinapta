// Comments on text, as Notion's: the spans of a commented range carry the
// ids of the discussions about them, which the editor marks.
import type { BlockId } from "./id.schema.ts";
import type { RichText, TextSpan } from "./rich-text.schema.ts";
import { concatRichText, splitRichText } from "./rich-text.ts";

export interface CommentRange {
  readonly start: number;
  readonly end: number;
}

function withComments(span: TextSpan, comments: readonly BlockId[]): TextSpan {
  const { comments: _before, ...plain } = span;
  return comments.length === 0 ? plain : { ...plain, comments: [...comments] };
}

export function addComment(
  rich: RichText,
  range: CommentRange,
  discussionId: BlockId,
): RichText {
  const { start, end } = range;
  if (start === end) return rich;
  const [before, rest] = splitRichText(rich, Math.min(start, end));
  const [middle, after] = splitRichText(rest, Math.abs(end - start));
  const marked = middle.map((span) =>
    withComments(span, [
      ...(span.comments ?? []).filter((id) => id !== discussionId),
      discussionId,
    ]),
  );
  return concatRichText(concatRichText(before, marked), after);
}

export function removeComment(rich: RichText, discussionId: BlockId): RichText {
  const unmarked = rich.map((span) =>
    withComments(
      span,
      (span.comments ?? []).filter((id) => id !== discussionId),
    ),
  );
  return concatRichText(unmarked, []);
}

// The text a range covers, as a discussion quotes it.
export function textOfRange(rich: RichText, range: CommentRange): string {
  const [, rest] = splitRichText(rich, Math.min(range.start, range.end));
  const [middle] = splitRichText(rest, Math.abs(range.end - range.start));
  return middle.map((span) => span.text).join("");
}
