import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const PAGE_TYPE = "page";

export const pagePropsSchema = v.object({
  title: richTextSchema,
  // One emoji, or null for no icon.
  icon: v.nullable(v.string()),
  isFavorite: v.boolean(),
  isTrashed: v.boolean(),
});

export type PageProps = v.InferOutput<typeof pagePropsSchema>;
export type PageBlock = TypedBlock<typeof PAGE_TYPE, PageProps>;
