import { describe, expect, it } from "vitest";
import { buildWorkspace, parseViewId, toBlockId } from "../model/index.ts";
import { parsePageHash } from "../ui/address/index.ts";
import {
  createInitialState,
  createInitialUiState,
  type Command,
} from "../state/index.ts";
import {
  hashForPage,
  hashForUi,
  isHomeHash,
  openFromHash,
  pageIdFromHash,
} from "./router.ts";

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

  it("writes and reads Home's own URL", () => {
    const ui = { ...createInitialUiState(), isHomeOpen: true };

    expect(hashForUi(ui)).toBe("#/home");
    expect(isHomeHash("#/home")).toBe(true);
    expect(isHomeHash("#/page/abc")).toBe(false);
  });

  it("writes a row open in a peek into the page's URL, and reads it back", () => {
    const viewId = parseViewId("view");
    if (viewId === undefined) throw new Error("setup");
    const peek = { pageId: toBlockId("row"), viewId, mode: "center" as const };
    const ui = {
      ...createInitialUiState(),
      activePageId: toBlockId("abc"),
      peek,
    };

    const hash = hashForUi(ui);

    expect(hash).toBe("#/page/abc?peek=row&view=view&mode=center");
    expect(parsePageHash(hash)).toEqual({ pageId: "abc", peek });
  });

  it("writes the open page's URL when Home is not shown", () => {
    const ui = { ...createInitialUiState(), activePageId: toBlockId("abc") };

    expect(hashForUi(ui)).toBe("#/page/abc");
  });
});

describe("opening a link to a block", () => {
  const workspace = buildWorkspace([
    { id: "p1", children: [{ id: "b1", type: "paragraph" }] },
  ]);
  const state = { ...createInitialState(), workspace };

  function open(hash: string): Command[] {
    const sent: Command[] = [];
    openFromHash(hash, state, (command) => {
      sent.push(command);
      return { ok: true };
    });
    return sent;
  }

  it("opens the page and puts the caret at the start of the block", () => {
    expect(open("#/page/p1?block=b1")).toEqual([
      expect.objectContaining({ type: "ui.setActivePage", pageId: "p1" }),
      expect.objectContaining({
        type: "ui.setSelection",
        selection: { blockId: "b1", anchorOffset: 0, focusOffset: 0 },
      }),
    ]);
  });

  it("opens a row in a peek over the page", () => {
    expect(open("#/page/p1?peek=b1&view=v1&mode=side")).toEqual([
      expect.objectContaining({ type: "ui.setActivePage", pageId: "p1" }),
      expect.objectContaining({
        type: "peek.open",
        peek: { pageId: "b1", viewId: "v1", mode: "side" },
      }),
    ]);
  });

  it("only opens the page when the block is gone", () => {
    expect(open("#/page/p1?block=gone").map((c) => c.type)).toEqual([
      "ui.setActivePage",
    ]);
  });
});
