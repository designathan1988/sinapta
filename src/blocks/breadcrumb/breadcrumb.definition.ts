import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { BREADCRUMB_TYPE, breadcrumbPropsSchema } from "./breadcrumb.schema.ts";
import { renderBreadcrumb } from "./breadcrumb.view.ts";

export const breadcrumbDefinition: BlockDefinition = {
  type: BREADCRUMB_TYPE,
  label: COPY.breadcrumbBlock.name,
  propsSchema: breadcrumbPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({}),
  render: (block, dispatch, state) =>
    block.type === BREADCRUMB_TYPE
      ? renderBreadcrumb(block.id, state, dispatch)
      : undefined,
};
