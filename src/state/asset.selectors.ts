import type { AssetId } from "../model/index.ts";
import type { AppState } from "./app-state.ts";

// The address a stored asset is shown from, once it is loaded.
export function selectAssetUrl(
  state: AppState,
  assetId: AssetId | string,
): string | undefined {
  return state.persistence.assetUrls[assetId];
}
