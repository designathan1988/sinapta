// Addresses of places in the app: the part of the URL after "#". The
// router reads and writes them, and a copied link to a block is one:
// "#/page/<pageId>?block=<blockId>". A row open in a peek over the page
// is in it too: "#/page/<pageId>?peek=<rowId>&view=<viewId>&mode=side".
import {
  parseBlockId,
  parseViewId,
  type BlockId,
  type ViewId,
} from "../../model/index.ts";

const PAGE_PREFIX = "#/page/";
const BLOCK_PARAM = "block";
const PEEK_PARAM = "peek";
const VIEW_PARAM = "view";
const MODE_PARAM = "mode";

export interface PeekAddress {
  readonly pageId: BlockId;
  // The view whose order the peek's next and previous rows follow.
  readonly viewId: ViewId;
  readonly mode: "side" | "center";
}

export interface PageAddress {
  readonly pageId: BlockId;
  // A block on the page to show, from a link to the block.
  readonly blockId?: BlockId;
  readonly peek?: PeekAddress;
}

export function hashForPage(pageId: BlockId | null): string {
  return pageId === null ? "" : `${PAGE_PREFIX}${pageId}`;
}

export function hashForBlock(pageId: BlockId, blockId: BlockId): string {
  const query = new URLSearchParams({ [BLOCK_PARAM]: blockId });
  return `${hashForPage(pageId)}?${query.toString()}`;
}

export function hashForPeek(pageId: BlockId, peek: PeekAddress): string {
  const query = new URLSearchParams({
    [PEEK_PARAM]: peek.pageId,
    [VIEW_PARAM]: peek.viewId,
    [MODE_PARAM]: peek.mode,
  });
  return `${hashForPage(pageId)}?${query.toString()}`;
}

function peekOf(query: URLSearchParams): PeekAddress | undefined {
  const pageId = parseBlockId(query.get(PEEK_PARAM) ?? "");
  const viewId = parseViewId(query.get(VIEW_PARAM) ?? "");
  const mode = query.get(MODE_PARAM);
  if (pageId === undefined || viewId === undefined) return undefined;
  return mode === "side" || mode === "center"
    ? { pageId, viewId, mode }
    : undefined;
}

export function parsePageHash(hash: string): PageAddress | null {
  if (!hash.startsWith(PAGE_PREFIX)) return null;
  const [path = "", query = ""] = hash.slice(PAGE_PREFIX.length).split("?");
  const pageId = parseBlockId(path);
  if (pageId === undefined) return null;
  const params = new URLSearchParams(query);
  const blockId = parseBlockId(params.get(BLOCK_PARAM) ?? "");
  const peek = peekOf(params);
  return {
    pageId,
    ...(blockId !== undefined && { blockId }),
    ...(peek !== undefined && { peek }),
  };
}

// The full address of a page, for pasting anywhere.
export function linkToPage(pageId: BlockId): string {
  return `${location.origin}${location.pathname}${hashForPage(pageId)}`;
}

// The full address of a block, for pasting anywhere.
export function linkToBlock(pageId: BlockId, blockId: BlockId): string {
  return `${location.origin}${location.pathname}${hashForBlock(pageId, blockId)}`;
}
