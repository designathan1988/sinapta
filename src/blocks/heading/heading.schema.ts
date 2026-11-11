import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const HEADING_TYPE = "heading";

export const headingPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
  level: v.picklist([1, 2, 3, 4]),
  // A toggle heading shows or hides the blocks inside it (version 7).
  isToggleable: v.optional(v.boolean()),
  isOpen: v.optional(v.boolean()),
});

export type HeadingProps = v.InferOutput<typeof headingPropsSchema>;
export type HeadingBlock = TypedBlock<typeof HEADING_TYPE, HeadingProps>;
