// Where a file a person adds to a block goes to be kept. The app wires in
// the asset store at startup; views hand files here and dispatch the
// outcome, so no file ever travels in a command.
import type { AssetSaveResult } from "../../model/index.ts";

export type AssetSaver = (file: Blob, name: string) => Promise<AssetSaveResult>;

// Until the app wires a store in, no file can be kept.
let saver: AssetSaver = () =>
  Promise.resolve({ ok: false, error: "unreadable" });

export function installAssetSaver(next: AssetSaver): void {
  saver = next;
}

export function saveAssetFile(
  file: Blob,
  name: string,
): Promise<AssetSaveResult> {
  return saver(file, name);
}
