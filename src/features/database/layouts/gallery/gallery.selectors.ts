// The picture a gallery card shows: the first image on the row's page.
import { IMAGE_TYPE, type ImageBlock } from "../../../../blocks/image/index.ts";
import { isBlockOfType, type BlockId } from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";

export function selectRowCover(
  state: AppState,
  rowId: BlockId,
): string | undefined {
  const row = state.workspace.blocks[rowId];
  for (const id of row?.childIds ?? []) {
    const block = state.workspace.blocks[id];
    if (block === undefined || !isBlockOfType<ImageBlock>(block, IMAGE_TYPE))
      continue;
    if (block.props.src !== "") return block.props.src;
  }
  return undefined;
}
