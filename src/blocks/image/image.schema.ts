import * as v from "valibot";
import {
  assetIdSchema,
  safeImageSource,
  type TypedBlock,
} from "../../model/index.ts";

export const IMAGE_TYPE = "image";

// How wide an image may be, as a percent of the page's column, and how far
// one arrow key press changes it.
export const IMAGE_WIDTH = { min: 10, max: 100, step: 5 } as const;

export const IMAGE_ALIGNS = ["left", "center", "right"] as const;
export type ImageAlign = (typeof IMAGE_ALIGNS)[number];

// An image starts with no address and gets one from its field. Format
// version 10 adds its width and alignment; without them it fills the
// column, centered.
export const imagePropsSchema = v.object({
  src: v.pipe(
    v.string(),
    v.check((src) => src === "" || safeImageSource(src) !== undefined),
  ),
  caption: v.string(),
  width: v.optional(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(IMAGE_WIDTH.min),
      v.maxValue(IMAGE_WIDTH.max),
    ),
  ),
  align: v.optional(v.picklist(IMAGE_ALIGNS)),
  // A file kept in the asset store (version 12); shown instead of src.
  assetId: v.optional(assetIdSchema),
});

export type ImageProps = v.InferOutput<typeof imagePropsSchema>;
export type ImageBlock = TypedBlock<typeof IMAGE_TYPE, ImageProps>;
