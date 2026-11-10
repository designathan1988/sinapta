import { isBlockOfType } from "../../model/index.ts";
import type { BlockDefinition } from "../block-definition.ts";
import {
  BULLETED_LIST_TYPE,
  bulletedListPropsSchema,
  type BulletedListBlock,
} from "./bulleted-list.schema.ts";
import { renderBulletedList } from "./bulleted-list.view.ts";

export const bulletedListDefinition: BlockDefinition = {
  type: BULLETED_LIST_TYPE,
  propsSchema: bulletedListPropsSchema,
  continuesAs: BULLETED_LIST_TYPE,
  createProps: (text) => ({ text }),
  render: (block) =>
    isBlockOfType<BulletedListBlock>(block, BULLETED_LIST_TYPE)
      ? renderBulletedList(block)
      : undefined,
};
