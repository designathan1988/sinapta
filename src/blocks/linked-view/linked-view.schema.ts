import * as v from "valibot";
import {
  blockIdSchema,
  viewIdSchema,
  type TypedBlock,
} from "../../model/index.ts";

export const LINKED_VIEW_TYPE = "linked-view";

// A view of a database that lives elsewhere, with views of its own: its
// filters, sorts and layout do not change the database's own views. It
// has no database until one is chosen.
export const linkedViewPropsSchema = v.object({
  databaseId: v.optional(blockIdSchema),
  viewIds: v.array(viewIdSchema),
});

export type LinkedViewProps = v.InferOutput<typeof linkedViewPropsSchema>;
export type LinkedViewBlock = TypedBlock<
  typeof LINKED_VIEW_TYPE,
  LinkedViewProps
>;
