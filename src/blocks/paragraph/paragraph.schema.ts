import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const PARAGRAPH_TYPE = "paragraph";

export const paragraphPropsSchema = v.object({
  text: richTextSchema,
});

export type ParagraphProps = v.InferOutput<typeof paragraphPropsSchema>;
export type ParagraphBlock = TypedBlock<typeof PARAGRAPH_TYPE, ParagraphProps>;
