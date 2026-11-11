import * as v from "valibot";
import { assetIdSchema, safeWebAddress } from "../../model/index.ts";

// What file, PDF, video and audio blocks hold: a secure web address or a
// file kept in the asset store, the file's name and size, and a caption.
export const mediaPropsSchema = v.object({
  url: v.pipe(
    v.string(),
    v.check((url) => url === "" || safeWebAddress(url) !== undefined),
  ),
  assetId: v.optional(assetIdSchema),
  name: v.optional(v.string()),
  size: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  caption: v.string(),
});

export type MediaProps = v.InferOutput<typeof mediaPropsSchema>;

export function emptyMediaProps(): MediaProps {
  return { url: "", caption: "" };
}
