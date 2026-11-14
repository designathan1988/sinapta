// Keeps the files people add to blocks (design decision D6). A file is
// stored as it is, under an asset id the store makes, the way a database
// makes its keys; blocks hold the id. Workspace files carry the bytes as
// base64.
import {
  MAX_ASSET_BYTES,
  parseAssetId,
  type AssetFile,
  type AssetSaveResult,
} from "../model/index.ts";
import {
  addAssetUrls,
  selectPlanLimits,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";
import type { StorageAdapter, StoredAsset } from "./storage-adapter.ts";

export interface AssetUpload {
  readonly file: Blob;
  readonly name: string;
  // The largest file allowed, in bytes; 50 MB unless a test says less.
  readonly limit?: number;
  // The largest file the workspace's plan allows: 5 MB on Free.
  readonly planLimit?: number;
}

// Only passive media is served under its own type. Anything else, such as
// HTML labelled as a PDF in an imported file, is served as plain bytes, so
// a frame that shows a file never runs its content.
const PASSIVE_TYPES =
  /^(image\/(png|jpeg|gif|webp|avif|bmp)|video\/[\w.+-]+|audio\/[\w.+-]+|application\/pdf)$/;

export function servedBlob(blob: Blob): Blob {
  return PASSIVE_TYPES.test(blob.type)
    ? blob
    : new Blob([blob], { type: "application/octet-stream" });
}

export function assetObjectUrl(blob: Blob): string {
  return URL.createObjectURL(servedBlob(blob));
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

export async function saveAsset(
  adapter: Pick<StorageAdapter, "putAssets">,
  upload: AssetUpload,
): Promise<AssetSaveResult> {
  const { file, name } = upload;
  if (file.size > (upload.limit ?? MAX_ASSET_BYTES)) {
    return { ok: false, error: "too-large" };
  }
  if (file.size > (upload.planLimit ?? Infinity)) {
    return { ok: false, error: "plan-limit" };
  }
  const id = parseAssetId(crypto.randomUUID());
  if (id === undefined) return { ok: false, error: "unreadable" };
  const asset = { id, type: file.type, name, size: file.size, blob: file };
  try {
    await adapter.putAssets([asset]);
  } catch (error) {
    return {
      ok: false,
      error: isQuotaError(error) ? "quota-exceeded" : "unreadable",
    };
  }
  return { ok: true, id, url: assetObjectUrl(file) };
}

// The address each stored asset is shown from, by asset id.
export async function loadAssetUrls(
  adapter: Pick<StorageAdapter, "loadAssets">,
): Promise<Record<string, string>> {
  const assets = await adapter.loadAssets();
  return Object.fromEntries(
    assets.map((asset) => [asset.id, assetObjectUrl(asset.blob)]),
  );
}

const CHUNK = 0x8000;

export async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return btoa(binary);
}

export function fromBase64(data: string, type: string): Blob {
  const binary = atob(data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

// Stored assets as a workspace file carries them, and back.
export async function toAssetFiles(
  assets: readonly StoredAsset[],
): Promise<AssetFile[]> {
  return Promise.all(
    assets.map(async ({ id, type, name, size, blob }) => ({
      id,
      type,
      name,
      size,
      data: await toBase64(blob),
    })),
  );
}

export function toStoredAssets(files: readonly AssetFile[]): StoredAsset[] {
  return files.map(({ id, type, name, size, data }) => ({
    id,
    type,
    name,
    size,
    blob: fromBase64(data, type),
  }));
}

export interface AssetStoreOptions {
  readonly adapter: Pick<StorageAdapter, "loadAssets" | "putAssets">;
  readonly dispatch: Dispatch;
  // Read when a file is added, for the open workspace's plan's limit.
  readonly store?: AppStore;
}

// Gives the store the addresses of the assets kept so far, and returns
// what keeps a new file.
export function startAssetStore(
  options: AssetStoreOptions,
): (file: Blob, name: string) => Promise<AssetSaveResult> {
  const { adapter, dispatch } = options;
  void loadAssetUrls(adapter)
    .then((urls) => {
      if (Object.keys(urls).length > 0) {
        dispatch(addAssetUrls.create({ urls }));
      }
    })
    .catch(() => undefined);
  return (file, name) => {
    const state = options.store?.getState();
    const planLimit =
      state === undefined ? undefined : selectPlanLimits(state)?.uploadBytes;
    return saveAsset(adapter, {
      file,
      name,
      ...(planLimit === undefined ? {} : { planLimit }),
    });
  };
}
