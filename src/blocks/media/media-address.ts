import { selectAssetUrl, type AppState } from "../../state/index.ts";
import type { MediaProps } from "./media.schema.ts";

// Where a media block's file is shown from: its stored file once that is
// loaded, or its web address.
export function mediaAddress(props: MediaProps, state: AppState): string {
  if (props.assetId === undefined) return props.url;
  return selectAssetUrl(state, props.assetId) ?? "";
}

export function isEmptyMedia(props: MediaProps): boolean {
  return props.url === "" && props.assetId === undefined;
}
