import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const CALLOUT_TYPE = "callout";

export const calloutPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
  // One emoji shown beside the text.
  icon: v.string(),
});

export type CalloutProps = v.InferOutput<typeof calloutPropsSchema>;
export type CalloutBlock = TypedBlock<typeof CALLOUT_TYPE, CalloutProps>;
