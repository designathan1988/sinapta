import type { BlockDefinition } from "../block-definition.ts";
import { PAGE_TYPE, pagePropsSchema } from "./page.schema.ts";

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
};
