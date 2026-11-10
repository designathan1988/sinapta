import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { DIVIDER_TYPE, dividerPropsSchema } from "./divider.schema.ts";
import { renderDivider } from "./divider.view.ts";

export const dividerDefinition: BlockDefinition = {
  type: DIVIDER_TYPE,
  propsSchema: dividerPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  // A divider holds no text.
  createProps: () => ({}),
  render: renderDivider,
};
