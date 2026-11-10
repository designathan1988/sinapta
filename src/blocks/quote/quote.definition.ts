import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  QUOTE_TYPE,
  quotePropsSchema,
  type QuoteBlock,
} from "./quote.schema.ts";
import { renderQuote } from "./quote.view.ts";

export const quoteDefinition: BlockDefinition = {
  type: QUOTE_TYPE,
  label: COPY.blockNames.quote,
  propsSchema: quotePropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({ text }),
  render: (block) =>
    isBlockOfType<QuoteBlock>(block, QUOTE_TYPE)
      ? renderQuote(block)
      : undefined,
};
