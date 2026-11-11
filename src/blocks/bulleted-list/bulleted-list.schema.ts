import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const BULLETED_LIST_TYPE = "bulleted-list";

export const bulletedListPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
});

export type BulletedListProps = v.InferOutput<typeof bulletedListPropsSchema>;
export type BulletedListBlock = TypedBlock<
  typeof BULLETED_LIST_TYPE,
  BulletedListProps
>;
