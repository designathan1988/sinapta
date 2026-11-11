// Version 12 keeps files beside the workspace (design decision D6). An
// image kept inside its block as a base64 data address moves into the
// file's assets: the asset takes the block's id, and the block keeps the
// asset's id and an empty address.
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

const BASE64_DATA_ADDRESS = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]*)$/;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The number of bytes base64 text stands for.
function byteCount(data: string): number {
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

interface Moved {
  readonly block: JsonRecord;
  readonly asset: JsonRecord;
}

function moveImage(block: unknown): Moved | undefined {
  if (!isRecord(block) || block.type !== "image") return undefined;
  const { id, props } = block;
  if (typeof id !== "string" || !isRecord(props)) return undefined;
  const { src } = props;
  if (typeof src !== "string") return undefined;
  const match = BASE64_DATA_ADDRESS.exec(src);
  if (match === null) return undefined;
  const [, type = "", raw = ""] = match;
  const data = raw.replace(/\s/g, "");
  return {
    block: { ...block, props: { ...props, src: "", assetId: id } },
    asset: { id, type, name: "image", size: byteCount(data), data },
  };
}

export const moveImagesToAssets: Migration = (file) => {
  const { blocks } = file;
  if (!isRecord(blocks)) return file;
  const existing: unknown = file.assets;
  const assets = Array.isArray(existing) ? Array.from<unknown>(existing) : [];
  const nextBlocks = Object.fromEntries(
    Object.entries(blocks).map(([id, block]) => {
      const moved = moveImage(block);
      if (moved === undefined) return [id, block];
      assets.push(moved.asset);
      return [id, moved.block];
    }),
  );
  return { ...file, blocks: nextBlocks, ...(assets.length > 0 && { assets }) };
};
