import { isBlockOfType } from "../../model/index.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  PAGE_LINK_TYPE,
  pageLinkPropsSchema,
  type PageLinkBlock,
} from "./page-link.schema.ts";
import { renderPageLink } from "./page-link.view.ts";

// Not offered as a plain block type: a link needs a page to point at, so
// it is created by choosing a page.
export const pageLinkDefinition: BlockDefinition = {
  type: PAGE_LINK_TYPE,
  propsSchema: pageLinkPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({}),
  render: (block, dispatch, state) =>
    isBlockOfType<PageLinkBlock>(block, PAGE_LINK_TYPE)
      ? renderPageLink(block, state, dispatch)
      : undefined,
};
