import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const BULLETED_LIST_TYPE = "bulleted-list";

export const bulletedListPropsSchema = v.object({
  text: richTextSchema,
});

export type BulletedListProps = v.InferOutput<typeof bulletedListPropsSchema>;
export type BulletedListBlock = TypedBlock<
  typeof BULLETED_LIST_TYPE,
  BulletedListProps
>;
