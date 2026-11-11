// Addresses of places in the app: the part of the URL after "#". The
// router reads and writes them, and a copied link to a block is one:
// "#/page/<pageId>?block=<blockId>".
import { parseBlockId, type BlockId } from "../../model/index.ts";

const PAGE_PREFIX = "#/page/";
const BLOCK_PARAM = "block";

export interface PageAddress {
  readonly pageId: BlockId;
  // A block on the page to show, from a link to the block.
  readonly blockId?: BlockId;
}

export function hashForPage(pageId: BlockId | null): string {
  return pageId === null ? "" : `${PAGE_PREFIX}${pageId}`;
}

export function hashForBlock(pageId: BlockId, blockId: BlockId): string {
  const query = new URLSearchParams({ [BLOCK_PARAM]: blockId });
  return `${hashForPage(pageId)}?${query.toString()}`;
}

export function parsePageHash(hash: string): PageAddress | null {
  if (!hash.startsWith(PAGE_PREFIX)) return null;
  const [path = "", query = ""] = hash.slice(PAGE_PREFIX.length).split("?");
  const pageId = parseBlockId(path);
  if (pageId === undefined) return null;
  const blockId = parseBlockId(
    new URLSearchParams(query).get(BLOCK_PARAM) ?? "",
  );
  return blockId === undefined ? { pageId } : { pageId, blockId };
}

// The full address of a block, for pasting anywhere.
export function linkToBlock(pageId: BlockId, blockId: BlockId): string {
  return `${location.origin}${location.pathname}${hashForBlock(pageId, blockId)}`;
}
