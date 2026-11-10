import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const NUMBERED_LIST_TYPE = "numbered-list";

export const numberedListPropsSchema = v.object({
  text: richTextSchema,
});

export type NumberedListProps = v.InferOutput<typeof numberedListPropsSchema>;
export type NumberedListBlock = TypedBlock<
  typeof NUMBERED_LIST_TYPE,
  NumberedListProps
>;
