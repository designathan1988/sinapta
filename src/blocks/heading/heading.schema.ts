import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const HEADING_TYPE = "heading";

export const headingPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
  level: v.picklist([1, 2, 3]),
});

export type HeadingProps = v.InferOutput<typeof headingPropsSchema>;
export type HeadingBlock = TypedBlock<typeof HEADING_TYPE, HeadingProps>;
