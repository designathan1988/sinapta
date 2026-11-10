import { describe, expect, it } from "vitest";
import { toBlockId } from "../model/index.ts";
import { hashForPage, pageIdFromHash } from "./router.ts";

describe("router", () => {
  it("reads the page id from a page URL", () => {
    expect(pageIdFromHash("#/page/abc")).toBe("abc");
  });

  it.each(["", "#", "#/page/", "#/elsewhere/abc"])(
    "reads no page from %j",
    (hash) => {
      expect(pageIdFromHash(hash)).toBeNull();
    },
  );

  it("writes a URL that it reads back to the same page", () => {
    const pageId = toBlockId("abc");

    expect(pageIdFromHash(hashForPage(pageId))).toBe(pageId);
  });

  it("writes an empty hash when no page is open", () => {
    expect(hashForPage(null)).toBe("");
  });
});
