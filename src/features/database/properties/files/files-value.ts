// A files property holds a list of files: each kept in the workspace as an
// asset, or linked from the web by a safe address, and shown by name.
import { safeWebAddress } from "../../../../model/index.ts";

export interface FileEntry {
  readonly name: string;
  readonly assetId?: string;
  readonly url?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEntry(stored: unknown): FileEntry | undefined {
  if (!isRecord(stored)) return undefined;
  const { name, assetId, url } = stored;
  if (typeof name !== "string" || name.trim() === "") return undefined;
  const hasAsset = typeof assetId === "string" && assetId !== "";
  const link = typeof url === "string" ? safeWebAddress(url) : undefined;
  if (hasAsset === (url !== undefined)) return undefined;
  if (hasAsset) return { name, assetId };
  return link === undefined ? undefined : { name, url: link };
}

// The files a cell holds; undefined when it holds none.
export function readFiles(stored: unknown): FileEntry[] | undefined {
  if (!Array.isArray(stored)) return undefined;
  const files = stored.flatMap((entry: unknown) => {
    const file = readEntry(entry);
    return file === undefined ? [] : [file];
  });
  return files.length === 0 ? undefined : files;
}

const IMAGE_NAME = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

// A file whose name or address ends as an image's does.
export function isImageFile(file: FileEntry): boolean {
  const path = file.url === undefined ? "" : new URL(file.url).pathname;
  return IMAGE_NAME.test(file.name) || IMAGE_NAME.test(path);
}

// Where the file is shown from: its link, or its asset's address.
export function fileSource(
  file: FileEntry,
  assetUrls: Readonly<Record<string, string>>,
): string | undefined {
  if (file.url !== undefined) return file.url;
  return file.assetId === undefined ? undefined : assetUrls[file.assetId];
}

// The name a link is listed by: the last part of its address.
export function nameOfLink(url: string): string {
  const parsed = new URL(url);
  const last = parsed.pathname.split("/").filter(Boolean).at(-1);
  return last === undefined ? parsed.hostname : decodeURIComponent(last);
}
