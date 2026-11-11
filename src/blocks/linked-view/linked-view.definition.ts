import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  LINKED_VIEW_TYPE,
  linkedViewPropsSchema,
} from "./linked-view.schema.ts";

// The editor shows a linked view through the database feature, which
// owns views; the slash menu makes one, so it has no label of its own.
export const linkedViewDefinition: BlockDefinition = {
  type: LINKED_VIEW_TYPE,
  propsSchema: linkedViewPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({ viewIds: [] }),
};
