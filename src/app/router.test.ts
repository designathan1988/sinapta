import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
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

  it("only opens the page when the block is gone", () => {
    expect(open("#/page/p1?block=gone").map((c) => c.type)).toEqual([
      "ui.setActivePage",
    ]);
  });
});
