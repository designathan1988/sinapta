import * as v from "valibot";
import { safeImageSource, type TypedBlock } from "../../model/index.ts";

export const IMAGE_TYPE = "image";

// An image starts with no address and gets one from its field.
export const imagePropsSchema = v.object({
  src: v.pipe(
    v.string(),
    v.check((src) => src === "" || safeImageSource(src) !== undefined),
  ),
  caption: v.string(),
});

export type ImageProps = v.InferOutput<typeof imagePropsSchema>;
export type ImageBlock = TypedBlock<typeof IMAGE_TYPE, ImageProps>;
