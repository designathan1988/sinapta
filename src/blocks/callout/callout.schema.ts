import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const CALLOUT_TYPE = "callout";

export const calloutPropsSchema = v.object({
  text: richTextSchema,
  // One emoji shown beside the text.
  icon: v.string(),
});

export type CalloutProps = v.InferOutput<typeof calloutPropsSchema>;
export type CalloutBlock = TypedBlock<typeof CALLOUT_TYPE, CalloutProps>;
