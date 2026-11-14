import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import {
  BULLETED_LIST_TYPE,
  bulletedListPropsSchema,
  type BulletedListBlock,
} from "./bulleted-list.schema.ts";
import { renderBulletedList } from "./bulleted-list.view.ts";
import { selectIsEditable } from "../../state/index.ts";

export const bulletedListDefinition: BlockDefinition = {
  type: BULLETED_LIST_TYPE,
  label: COPY.blockNames.bulletedList,
  propsSchema: bulletedListPropsSchema,
  continuesAs: BULLETED_LIST_TYPE,
  createProps: (text) => ({ text }),
  drawnFrom: () => [],
  render: (block, _dispatch, state) =>
    isBlockOfType<BulletedListBlock>(block, BULLETED_LIST_TYPE)
      ? renderBulletedList(block, selectIsEditable(state, block.id))
      : undefined,
};
