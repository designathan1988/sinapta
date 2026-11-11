import * as v from "valibot";
import {
  richTextSchema,
  safeImageSource,
  type TypedBlock,
} from "../../model/index.ts";

export const PAGE_TYPE = "page";
// A database is listed, opened, favorited and trashed like a page, and
// carries the same props for that, so page selectors accept both.
export const DATABASE_TYPE = "database";
export const PAGE_LIKE_TYPES: readonly string[] = [PAGE_TYPE, DATABASE_TYPE];

// Covers drawn from the theme's colors; their look is in the editor's CSS.
export const COVER_PRESETS = [
  "sunrise",
  "ocean",
  "forest",
  "dusk",
  "sand",
  "slate",
] as const;

// A preset name or the address of an image.
export function isCover(cover: string): boolean {
  return (
    COVER_PRESETS.some((preset) => preset === cover) ||
    safeImageSource(cover) !== undefined
  );
}

export const pagePropsSchema = v.object({
  title: richTextSchema,
  // One emoji, or null for no icon.
  icon: v.nullable(v.string()),
  isFavorite: v.boolean(),
  isTrashed: v.boolean(),
  // Cell values, by property id, when the page is a row of a database.
  values: v.optional(v.record(v.string(), v.unknown())),
  // A cover above the page, or null for none (schema version 4).
  cover: v.optional(v.nullable(v.pipe(v.string(), v.check(isCover)))),
  // The page uses the whole width of the window (schema version 4).
  isFullWidth: v.optional(v.boolean()),
});

export type PageProps = v.InferOutput<typeof pagePropsSchema>;
export type PageBlock = TypedBlock<string, PageProps>;
