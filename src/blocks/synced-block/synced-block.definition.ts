import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { shownHolder, syncedBlockCommands } from "./synced-block.commands.ts";
import {
  SYNCED_BLOCK_TYPE,
  syncedBlockPropsSchema,
  type SyncedBlock,
} from "./synced-block.schema.ts";
import { tidySyncedBlocks } from "./synced-block-tidy.ts";
import { renderSyncedBlock } from "./synced-block.view.ts";

// Blocks shown in several places at once. Made from text, it starts with
// that text inside it; copied with "Copy and sync", it pastes as a
// reference that shows the original's blocks.
export const syncedBlockDefinition: BlockDefinition = {
  type: SYNCED_BLOCK_TYPE,
  label: COPY.syncedBlock.name,
  propsSchema: syncedBlockPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({}),
  holdsBlocks: true,
  startsWithChild: true,
  shownHolder: (block, state) => shownHolder(state, block),
  commands: syncedBlockCommands,
  tidy: tidySyncedBlocks,
  render: (block, dispatch, state) =>
    isBlockOfType<SyncedBlock>(block, SYNCED_BLOCK_TYPE)
      ? renderSyncedBlock(block, dispatch, state)
      : undefined,
};
