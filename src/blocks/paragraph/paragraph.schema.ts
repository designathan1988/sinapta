import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const PARAGRAPH_TYPE = "paragraph";

export const paragraphPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
});

export type ParagraphProps = v.InferOutput<typeof paragraphPropsSchema>;
export type ParagraphBlock = TypedBlock<typeof PARAGRAPH_TYPE, ParagraphProps>;
