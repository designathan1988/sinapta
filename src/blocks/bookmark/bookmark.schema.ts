import * as v from "valibot";
import { safeHref, type TypedBlock } from "../../model/index.ts";

export const BOOKMARK_TYPE = "bookmark";

// A link a bookmark may hold: a web page, so http or https only. Empty
// until the address is given.
export function safeBookmarkUrl(url: string): string | undefined {
  const href = safeHref(url);
  return href?.startsWith("http") === true ? href : undefined;
}

export const bookmarkPropsSchema = v.object({
  url: v.pipe(
    v.string(),
    v.check((url) => url === "" || safeBookmarkUrl(url) !== undefined),
  ),
  // What the page says of itself, read by the server once (ADR-0013).
  preview: v.optional(
    v.object({
      title: v.string(),
      description: v.string(),
      image: v.nullable(v.string()),
      icon: v.nullable(v.string()),
    }),
  ),
});

export type BookmarkProps = v.InferOutput<typeof bookmarkPropsSchema>;
export type BookmarkBlock = TypedBlock<typeof BOOKMARK_TYPE, BookmarkProps>;
