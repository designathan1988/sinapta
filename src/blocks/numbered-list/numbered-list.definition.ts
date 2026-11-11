import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import {
  NUMBERED_LIST_TYPE,
  numberedListPropsSchema,
  type NumberedListBlock,
} from "./numbered-list.schema.ts";
import { selectListMarker } from "./numbered-list.selectors.ts";
import { renderNumberedList } from "./numbered-list.view.ts";

export const numberedListDefinition: BlockDefinition = {
  type: NUMBERED_LIST_TYPE,
  label: COPY.blockNames.numberedList,
  propsSchema: numberedListPropsSchema,
  continuesAs: NUMBERED_LIST_TYPE,
  createProps: (text) => ({ text }),
  render: (block, _dispatch, state) =>
    isBlockOfType<NumberedListBlock>(block, NUMBERED_LIST_TYPE)
      ? renderNumberedList(block, selectListMarker(state, block.id))
      : undefined,
};
