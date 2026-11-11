import * as v from "valibot";
import { blockIdSchema, type TypedBlock } from "../../model/index.ts";

export const SYNCED_BLOCK_TYPE = "synced-block";

// An original synced block holds blocks; a reference names the original
// with sourceId and shows the original's blocks in its place.
export const syncedBlockPropsSchema = v.object({
  sourceId: v.optional(blockIdSchema),
});

export type SyncedBlockProps = v.InferOutput<typeof syncedBlockPropsSchema>;
export type SyncedBlock = TypedBlock<
  typeof SYNCED_BLOCK_TYPE,
  SyncedBlockProps
>;
