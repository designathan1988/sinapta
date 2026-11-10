import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const PAGE_TYPE = "page";
// A database is listed, opened, favorited and trashed like a page, and
// carries the same props for that, so page selectors accept both.
export const DATABASE_TYPE = "database";
export const PAGE_LIKE_TYPES: readonly string[] = [PAGE_TYPE, DATABASE_TYPE];

export const pagePropsSchema = v.object({
  title: richTextSchema,
  // One emoji, or null for no icon.
  icon: v.nullable(v.string()),
  isFavorite: v.boolean(),
  isTrashed: v.boolean(),
  // Cell values, by property id, when the page is a row of a database.
  values: v.optional(v.record(v.string(), v.unknown())),
});

export type PageProps = v.InferOutput<typeof pagePropsSchema>;
export type PageBlock = TypedBlock<string, PageProps>;
