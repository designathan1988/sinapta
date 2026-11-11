// Block menu items of synced blocks: "Copy and sync" keeps a reference to
// paste anywhere, and "Unsync" gives a reference its own copy.
import {
  selectUnsyncSize,
  SYNCED_BLOCK_TYPE,
  unsyncBlock,
} from "../../blocks/synced-block/index.ts";
import { parseBlockId, type Block } from "../../model/index.ts";
import {
  setClipboard,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { writeSystemClipboard } from "./editor-clipboard.view.ts";

// The text put on the system clipboard with a reference; a paste of it
// in this tab brings the reference back.
function referenceText(sourceId: string): string {
  return `${COPY.syncedBlock.name} ${sourceId}`;
}

export function syncedItems(
  block: Block,
  state: AppState,
  dispatch: Dispatch,
): MenuItem[] {
  if (block.type !== SYNCED_BLOCK_TYPE) return [];
  const { sourceId } = block.props;
  const source =
    typeof sourceId === "string" ? parseBlockId(sourceId) : undefined;
  const copy = (): void => {
    const original = source ?? block.id;
    const text = referenceText(original);
    const blocks = [
      { kind: SYNCED_BLOCK_TYPE, depth: 0, text: [], sourceId: original },
    ];
    dispatch(setClipboard.create({ clipboard: { text, blocks } }));
    writeSystemClipboard(text);
    announce(COPY.syncedBlock.copied);
  };
  const unsync = (): void => {
    const blockCount = selectUnsyncSize(state, block.id);
    dispatch(unsyncBlock.create({ blockId: block.id, blockCount }));
  };
  const copyItem: MenuItem = { label: COPY.syncedBlock.copy, onSelect: copy };
  if (source === undefined) return [copyItem];
  return [copyItem, { label: COPY.syncedBlock.unsync, onSelect: unsync }];
}
