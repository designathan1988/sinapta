// Files kept beside the workspace (design decision D6): blocks hold an
// asset id, the bytes live in the asset store, and a workspace file
// carries them as base64. Asset entries of a file are read here.
import * as v from "valibot";

export const assetIdSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.brand("AssetId"),
);

export type AssetId = v.InferOutput<typeof assetIdSchema>;

// The largest file the asset store keeps.
export const MAX_ASSET_BYTES = 50 * 1024 * 1024;

export type AssetError =
  "too-large" | "plan-limit" | "quota-exceeded" | "unreadable";

// What keeping a file comes to: its asset and the address it is shown
// from, or why it could not be kept.
export type AssetSaveResult =
  | { readonly ok: true; readonly id: AssetId; readonly url: string }
  | { readonly ok: false; readonly error: AssetError };

// One asset in a workspace file.
export const assetFileSchema = v.object({
  id: assetIdSchema,
  // A media type, such as image/png.
  type: v.string(),
  name: v.string(),
  size: v.pipe(v.number(), v.integer(), v.minValue(0)),
  data: v.pipe(v.string(), v.base64()),
});

export type AssetFile = v.InferOutput<typeof assetFileSchema>;

export function parseAssetId(text: string): AssetId | undefined {
  const result = v.safeParse(assetIdSchema, text);
  return result.success ? result.output : undefined;
}

// The assets of a workspace file, if it has any; entries that do not
// parse are left out.
export function parseAssetFiles(value: unknown): AssetFile[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    const result = v.safeParse(assetFileSchema, entry);
    return result.success ? [result.output] : [];
  });
}
