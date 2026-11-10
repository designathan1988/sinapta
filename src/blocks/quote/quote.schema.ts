import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const QUOTE_TYPE = "quote";

export const quotePropsSchema = v.object({
  text: richTextSchema,
});

export type QuoteProps = v.InferOutput<typeof quotePropsSchema>;
export type QuoteBlock = TypedBlock<typeof QUOTE_TYPE, QuoteProps>;
