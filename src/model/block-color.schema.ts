import * as v from "valibot";

// A whole block's color: one of the nine tones for its text, or the same
// tone as its background (schema version 6).
export const blockColorSchema = v.picklist([
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "gray-background",
  "brown-background",
  "orange-background",
  "yellow-background",
  "green-background",
  "blue-background",
  "purple-background",
  "pink-background",
  "red-background",
]);

export type BlockColor = v.InferOutput<typeof blockColorSchema>;

export function isBlockColor(value: unknown): value is BlockColor {
  return v.is(blockColorSchema, value);
}
