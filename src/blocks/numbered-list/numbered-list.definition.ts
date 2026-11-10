import { isBlockOfType } from "../../model/index.ts";
import type { BlockDefinition } from "../block-definition.ts";
import {
  NUMBERED_LIST_TYPE,
  numberedListPropsSchema,
  type NumberedListBlock,
} from "./numbered-list.schema.ts";
import { renderNumberedList } from "./numbered-list.view.ts";

export const numberedListDefinition: BlockDefinition = {
  type: NUMBERED_LIST_TYPE,
  propsSchema: numberedListPropsSchema,
  continuesAs: NUMBERED_LIST_TYPE,
  createProps: (text) => ({ text }),
  render: (block) =>
    isBlockOfType<NumberedListBlock>(block, NUMBERED_LIST_TYPE)
      ? renderNumberedList(block)
      : undefined,
};
