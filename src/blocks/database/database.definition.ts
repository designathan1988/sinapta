import type { BlockDefinition } from "../block-definition.ts";
import { DATABASE_TYPE } from "../page/index.ts";
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
};
