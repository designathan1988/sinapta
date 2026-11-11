import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const NUMBERED_LIST_TYPE = "numbered-list";

export const numberedListPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
});

export type NumberedListProps = v.InferOutput<typeof numberedListPropsSchema>;
export type NumberedListBlock = TypedBlock<
  typeof NUMBERED_LIST_TYPE,
  NumberedListProps
>;
