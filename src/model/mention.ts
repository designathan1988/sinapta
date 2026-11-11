// Mentions of pages and dates inside rich text: inserted in place of what
// was typed to find them, and kept in step with the titles they show.
import type { BlockId } from "./id.schema.ts";
import { deleteRange, splitRichText } from "./rich-text.ts";
import type { RichText, TextSpan } from "./rich-text.schema.ts";
import { concatRichText } from "./rich-text.ts";

export interface MentionInsert {
  // The range typed to find the mention, such as "@pl".
  readonly start: number;
  readonly end: number;
  // A span with its mention set.
  readonly span: TextSpan;
}

export function insertMention(rich: RichText, insert: MentionInsert): RichText {
  const kept = deleteRange(rich, insert.start, insert.end);
  const [before, after] = splitRichText(kept, insert.start);
  return concatRichText(concatRichText(before, [insert.span]), after);
}

// The same text with every mention of the page showing its new title. The
// same reference comes back when nothing mentions the page.
export function renameMentions(
  rich: RichText,
  pageId: BlockId,
  title: string,
): RichText {
  const isOf = (span: TextSpan): boolean =>
    span.mention?.kind === "page" && span.mention.pageId === pageId;
  if (!rich.some(isOf)) return rich;
  return rich.map((span) => (isOf(span) ? { ...span, text: title } : span));
}

export function mentionsPage(rich: RichText, pageId: BlockId): boolean {
  return rich.some(
    (span) => span.mention?.kind === "page" && span.mention.pageId === pageId,
  );
}

// Whether the character at an offset is part of a mention.
export function isInMention(rich: RichText, offset: number): boolean {
  let position = 0;
  for (const span of rich) {
    const end = position + span.text.length;
    if (offset >= position && offset < end) return span.mention !== undefined;
    position = end;
  }
  return false;
}
