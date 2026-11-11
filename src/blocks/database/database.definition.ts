import type { BlockDefinition } from "../block-definition.ts";
import { DATABASE_TYPE, isPageLike, renderPageRow } from "../page/index.ts";
import { databasePropsSchema } from "./database.schema.ts";

export const databaseDefinition: BlockDefinition = {
  type: DATABASE_TYPE,
  propsSchema: databasePropsSchema,
  continuesAs: DATABASE_TYPE,
  createProps: (title) => ({
    title,
    icon: null,
    isFavorite: false,
    isTrashed: false,
    properties: [],
    viewIds: [],
  }),
  // Inside a page, a database is one line that opens it.
  showsChildren: () => false,
  render: (block, dispatch) =>
    isPageLike(block) ? renderPageRow(block, dispatch) : undefined,
};
