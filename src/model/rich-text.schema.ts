import * as v from "valibot";
import { blockIdSchema } from "./id.schema.ts";

// The nine named tones of Notion's palette, shared by text color,
// highlight and select options.
export const toneSchema = v.picklist([
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
]);

export const mentionSchema = v.variant("kind", [
  v.object({ kind: v.literal("page"), pageId: blockIdSchema }),
  v.object({
    kind: v.literal("date"),
    // A day, as "2026-11-11".
    date: v.pipe(v.string(), v.isoDate()),
    isReminder: v.optional(v.boolean()),
  }),
]);

// The tones in order, for lists of colors to choose from.
export const TONES = toneSchema.options;

export const textSpanSchema = v.object({
  text: v.string(),
  marks: v.optional(
    v.array(
      v.picklist(["bold", "italic", "code", "underline", "strikethrough"]),
    ),
  ),
  href: v.optional(v.string()),
  // Added in schema version 2.
  color: v.optional(toneSchema),
  highlight: v.optional(toneSchema),
  // A mention of a page or a date, shown as one piece (version 8). The
  // span's text is what it shows: the page's title, or the date written
  // out.
  mention: v.optional(mentionSchema),
  // An inline equation, shown as one piece (version 11): its TeX source,
  // which is also the span's text.
  equation: v.optional(v.string()),
});

export const richTextSchema = v.array(textSpanSchema);

export type Tone = v.InferOutput<typeof toneSchema>;
export type TextSpan = v.InferOutput<typeof textSpanSchema>;
export type Mention = v.InferOutput<typeof mentionSchema>;
export type RichText = v.InferOutput<typeof richTextSchema>;
