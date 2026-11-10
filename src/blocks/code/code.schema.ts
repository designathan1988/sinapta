import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const CODE_TYPE = "code";

export const codePropsSchema = v.object({
  text: richTextSchema,
});

export type CodeProps = v.InferOutput<typeof codePropsSchema>;
export type CodeBlock = TypedBlock<typeof CODE_TYPE, CodeProps>;
