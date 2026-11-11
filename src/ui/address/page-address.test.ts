import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { hashForBlock, hashForPage, parsePageHash } from "./page-address.ts";

const PAGE = toBlockId("p1");
const BLOCK = toBlockId("b1");

describe("page addresses", () => {
  it("reads a page and a block back from a link to the block", () => {
    expect(parsePageHash(hashForBlock(PAGE, BLOCK))).toEqual({
      pageId: PAGE,
      blockId: BLOCK,
    });
  });

  it("reads a page without a block from a page's own address", () => {
    expect(parsePageHash(hashForPage(PAGE))).toEqual({ pageId: PAGE });
  });

  it.each(["#/page/p1?block=", "#/page/p1?other=b1", "#/page/?block=b1"])(
    "reads no block from %j",
    (hash) => {
      expect(parsePageHash(hash)?.blockId).toBeUndefined();
    },
  );
});
