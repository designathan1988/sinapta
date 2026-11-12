import type { BlockDefinition } from "../block-definition.ts";
import { renderPageRow } from "./page-row.view.ts";
import { PAGE_TYPE, pagePropsSchema } from "./page.schema.ts";
import { isPageLike } from "./page.selectors.ts";

export const pageDefinition: BlockDefinition = {
  type: PAGE_TYPE,
  propsSchema: pagePropsSchema,
  continuesAs: PAGE_TYPE,
  createProps: (title) => ({
    title,
    icon: null,
    isFavorite: false,
    isTrashed: false,
  }),
  // Inside another page, a subpage is one line; its blocks are its own.
  showsChildren: () => false,
  drawnFrom: () => [],
  render: (block, dispatch) =>
    isPageLike(block) ? renderPageRow(block, dispatch) : undefined,
};
