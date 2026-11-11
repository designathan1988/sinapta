// Where an image is shown from: its stored asset once that is loaded, or
// its web address.
import { selectAssetUrl, type AppState } from "../../state/index.ts";
import type { ImageBlock } from "./image.schema.ts";

export function imageAddress(block: ImageBlock, state: AppState): string {
  const { assetId, src } = block.props;
  if (assetId === undefined) return src;
  return selectAssetUrl(state, assetId) ?? "";
}

// True for an image that has neither a file nor an address yet.
export function isEmptyImage(block: ImageBlock): boolean {
  return block.props.src === "" && block.props.assetId === undefined;
}
