// The props every block that holds text has: the text, and since schema
// version 6 an optional color for the whole block. Each text block type
// spreads these entries into its own props schema.
import * as v from "valibot";
import { blockColorSchema, richTextSchema } from "../model/index.ts";

export const TEXT_BLOCK_ENTRIES = {
  text: richTextSchema,
  color: v.optional(blockColorSchema),
};
