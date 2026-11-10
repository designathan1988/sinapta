import { isBlockOfType } from "../../model/index.ts";
import type { BlockDefinition } from "../block-definition.ts";
import {
  PARAGRAPH_TYPE,
  paragraphPropsSchema,
  type ParagraphBlock,
} from "./paragraph.schema.ts";
import { renderParagraph } from "./paragraph.view.ts";

export const paragraphDefinition: BlockDefinition = {
  type: PARAGRAPH_TYPE,
  propsSchema: paragraphPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({ text }),
  render: (block) =>
    isBlockOfType<ParagraphBlock>(block, PARAGRAPH_TYPE)
      ? renderParagraph(block)
      : undefined,
};
