import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";
import { toEmbedUrl } from "./embed-hosts.ts";

export const EMBED_TYPE = "embed";

// How tall an embed may be, in CSS pixels, and how far one arrow key
// press changes it.
export const EMBED_HEIGHT = { min: 160, max: 1200, initial: 360, step: 40 };

// A page from an allowed host, kept as the address people pasted.
export const embedPropsSchema = v.object({
  url: v.pipe(
    v.string(),
    v.check((url) => url === "" || toEmbedUrl(url) !== undefined),
  ),
  height: v.optional(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(EMBED_HEIGHT.min),
      v.maxValue(EMBED_HEIGHT.max),
    ),
  ),
});

export type EmbedProps = v.InferOutput<typeof embedPropsSchema>;
export type EmbedBlock = TypedBlock<typeof EMBED_TYPE, EmbedProps>;
