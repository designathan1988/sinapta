// Suggested edits, as Notion's Suggesting: text typed is kept as a
// suggested insertion and text deleted as a suggested deletion, each span
// carrying the discussion that holds it. Accepting keeps an insertion and
// takes a deletion's text away; rejecting does the opposite.
import type { BlockId } from "./id.schema.ts";
import type { RichText, TextSpan } from "./rich-text.schema.ts";
import { concatRichText, splitRichText } from "./rich-text.ts";

export type SuggestionKind = "insert" | "delete";

function isOf(span: TextSpan, discussionId: BlockId): boolean {
  return span.comments?.includes(discussionId) === true;
}

// The span without the suggestion and without its discussion.
function settled(span: TextSpan, discussionId: BlockId): TextSpan {
  const { suggestion: _kind, comments, ...plain } = span;
  const rest = (comments ?? []).filter((id) => id !== discussionId);
  return rest.length === 0 ? plain : { ...plain, comments: rest };
}

// Typed text kept as a suggested insertion at the offset, in the style of
// the text before it.
export function suggestInsert(
  rich: RichText,
  offset: number,
  insertion: { readonly text: string; readonly discussionId: BlockId },
): RichText {
  const [before, after] = splitRichText(rich, offset);
  const {
    mention: _mention,
    equation: _equation,
    comments: _comments,
    suggestion: _suggestion,
    ...style
  } = before.at(-1) ?? { text: "" };
  const span: TextSpan = {
    ...style,
    text: insertion.text.normalize("NFC"),
    suggestion: "insert",
    comments: [insertion.discussionId],
  };
  return concatRichText(concatRichText(before, [span]), after);
}

// Deleted text kept, struck, as a suggested deletion; text that was
// itself only a suggested insertion goes for good.
export function suggestDelete(
  rich: RichText,
  range: { readonly start: number; readonly end: number },
  discussionId: BlockId,
): RichText {
  const [before, rest] = splitRichText(rich, range.start);
  const [middle, after] = splitRichText(rest, range.end - range.start);
  const struck = middle.flatMap((span): TextSpan[] => {
    if (span.suggestion === "insert") return [];
    if (span.suggestion === "delete") return [span];
    const comments = [...(span.comments ?? []), discussionId];
    return [{ ...span, suggestion: "delete", comments }];
  });
  return concatRichText(concatRichText(before, struck), after);
}

// Keeps what the discussion suggests.
export function acceptSuggestion(
  rich: RichText,
  discussionId: BlockId,
): RichText {
  const kept = rich.flatMap((span): TextSpan[] => {
    if (!isOf(span, discussionId)) return [span];
    return span.suggestion === "delete" ? [] : [settled(span, discussionId)];
  });
  return concatRichText(kept, []);
}

// Undoes what the discussion suggests.
export function rejectSuggestion(
  rich: RichText,
  discussionId: BlockId,
): RichText {
  const kept = rich.flatMap((span): TextSpan[] => {
    if (!isOf(span, discussionId)) return [span];
    return span.suggestion === "insert" ? [] : [settled(span, discussionId)];
  });
  return concatRichText(kept, []);
}

// The text a discussion suggests to add or delete.
export function suggestedText(rich: RichText, discussionId: BlockId): string {
  return rich
    .filter((span) => isOf(span, discussionId) && span.suggestion !== undefined)
    .map((span) => span.text)
    .join("");
}
