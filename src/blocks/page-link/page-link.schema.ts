import * as v from "valibot";
import { blockIdSchema, type TypedBlock } from "../../model/index.ts";

export const PAGE_LINK_TYPE = "page-link";

export const pageLinkPropsSchema = v.object({
  pageId: blockIdSchema,
});

export type PageLinkProps = v.InferOutput<typeof pageLinkPropsSchema>;
export type PageLinkBlock = TypedBlock<typeof PAGE_LINK_TYPE, PageLinkProps>;
