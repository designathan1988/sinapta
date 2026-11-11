import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const CODE_TYPE = "code";

export const codePropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
});

export type CodeProps = v.InferOutput<typeof codePropsSchema>;
export type CodeBlock = TypedBlock<typeof CODE_TYPE, CodeProps>;
