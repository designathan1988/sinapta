import * as v from "valibot";
import { blockIdSchema } from "./id.schema.ts";
import { safeHref } from "./link-href.ts";

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
  // A person of the workspace (ADR-0013), named as they were when
  // mentioned.
  v.object({
    kind: v.literal("person"),
    userId: v.pipe(v.string(), v.minLength(1)),
    name: v.string(),
  }),
  // A web page, as Notion's "Paste as › Mention": shown by its title.
  v.object({
    kind: v.literal("link"),
    href: v.pipe(
      v.string(),
      v.check((href) => safeHref(href) !== undefined),
    ),
    // True once the mention shows the page's own title, read by the server.
    isTitled: v.optional(v.boolean()),
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
  // The discussions about this text, by id, which the editor marks.
  comments: v.optional(v.array(blockIdSchema)),
  // A suggested edit, held by one of its discussions: text to add, or
  // text to delete, until accepted or rejected.
  suggestion: v.optional(v.picklist(["insert", "delete"])),
});

export const richTextSchema = v.array(textSpanSchema);

export type Tone = v.InferOutput<typeof toneSchema>;
export type TextSpan = v.InferOutput<typeof textSpanSchema>;
export type Mention = v.InferOutput<typeof mentionSchema>;
export type RichText = v.InferOutput<typeof richTextSchema>;
