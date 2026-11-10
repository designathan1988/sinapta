import * as v from "valibot";

export const textSpanSchema = v.object({
  text: v.string(),
  marks: v.optional(v.array(v.picklist(["bold", "italic", "code"]))),
  href: v.optional(v.string()),
});

export const richTextSchema = v.array(textSpanSchema);

export type TextSpan = v.InferOutput<typeof textSpanSchema>;
export type RichText = v.InferOutput<typeof richTextSchema>;
