import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const QUOTE_TYPE = "quote";

export const quotePropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
});

export type QuoteProps = v.InferOutput<typeof quotePropsSchema>;
export type QuoteBlock = TypedBlock<typeof QUOTE_TYPE, QuoteProps>;
