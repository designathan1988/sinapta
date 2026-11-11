import * as v from "valibot";

// The eight named tones of the chip palette, shared by text color,
// highlight and select options.
export const toneSchema = v.picklist([
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "red",
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
});

export const richTextSchema = v.array(textSpanSchema);

export type Tone = v.InferOutput<typeof toneSchema>;
export type TextSpan = v.InferOutput<typeof textSpanSchema>;
export type RichText = v.InferOutput<typeof richTextSchema>;
