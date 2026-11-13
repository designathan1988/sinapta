import * as v from "valibot";
import {
  blockIdSchema,
  propertyIdSchema,
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

export const PAGE_FONTS = ["default", "serif", "mono"] as const;
const pageFontSchema = v.picklist(PAGE_FONTS);

// A comment, by the one person who uses the app.
export const pageCommentSchema = v.object({
  id: blockIdSchema,
  text: v.string(),
  createdAt: v.string(),
});

// A discussion, as Notion's: its comments, about the page, one of its
// blocks, or one of a database row's property values; resolved or open.
export const discussionSchema = v.object({
  id: blockIdSchema,
  // The block it is about, or null for the page itself.
  blockId: v.nullable(blockIdSchema),
  // On a database row with no block: the property whose value it is about.
  propertyId: v.optional(propertyIdSchema),
  // The text or value it was started on, as it read then.
  quote: v.optional(v.string()),
  isResolved: v.boolean(),
  comments: v.array(pageCommentSchema),
});

export type Discussion = v.InferOutput<typeof discussionSchema>;

// How often a template makes a row, as Notion's "Repeat".
export const REPEAT_PERIODS = ["day", "week", "month", "year"] as const;

const repeatSchema = v.object({
  every: v.picklist(REPEAT_PERIODS),
  // The next day it makes a row, "2026-11-12".
  next: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
});

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
  // How far down the cover image is shown, from 0 (top) to 100 (bottom)
  // (schema version 5).
  coverPosition: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
  // The typeface of the page's text, and a smaller text size (version 5).
  font: v.optional(pageFontSchema),
  isSmallText: v.optional(v.boolean()),
  // Locked: its text, blocks and settings stay as they are; a locked
  // database keeps its properties and views, its rows free.
  isLocked: v.optional(v.boolean()),
  // When it went to the trash, which empties itself of pages kept there
  // over 30 days, as Notion's does.
  trashedAt: v.optional(v.string()),
  // Where the page shows the pages that link to it: a count that opens
  // them (the default), always open, or not at all.
  backlinks: v.optional(v.picklist(["expanded", "popover", "off"])),
  // The discussions on the page and its blocks.
  discussions: v.optional(v.array(discussionSchema)),
  // A database template's repeat: it makes a row from itself on its days.
  repeat: v.optional(repeatSchema),
});

export type PageProps = v.InferOutput<typeof pagePropsSchema>;
export type PageFont = v.InferOutput<typeof pageFontSchema>;
export type RepeatPeriod = (typeof REPEAT_PERIODS)[number];
export type PageBlock = TypedBlock<string, PageProps>;
