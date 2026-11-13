// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { OpenOverlay } from "../../state/index.ts";
import { renderBlocks } from "./editor-blocks.view.ts";
import { createApp, text } from "./editor-builder.ts";

// A page with "/" or "/hea" typed on line a and "Plan" on line b, the
// slash menu open on line a when asked.
function lineOf(typed: string, overlay: OpenOverlay | null) {
  const { store } = createApp([text("a", typed), text("b", "Plan")]);
  const state = store.getState();
  const selection = {
    blockId: toBlockId("a"),
    anchorOffset: typed.length,
    focusOffset: typed.length,
  };
  const host = document.createElement("div");
  render(
    renderBlocks(toBlockId("page"), {
      state: { ...state, ui: { ...state.ui, overlay, selection } },
      dispatch: () => ({ ok: true }),
    }),
    host,
  );
  const block = (id: string) =>
    host.querySelector<HTMLElement>(`.editor__block[data-block-id="${id}"]`);
  return { a: block("a"), b: block("b") };
}

const SLASH = { kind: "slash-menu", anchorId: "a", start: 0 };

describe("the line the slash menu is open on", () => {
  it("is marked, and empty after the slash until a word follows it", () => {
    const { a, b } = lineOf("/", SLASH);

    expect(a?.hasAttribute("data-slash")).toBe(true);
    expect(a?.hasAttribute("data-slash-empty")).toBe(true);
    expect(a?.style.getPropertyValue("--editor-slash-hint")).toBe(
      '"Type to search"',
    );
    expect(b?.hasAttribute("data-slash")).toBe(false);
  });

  it("keeps the wash and drops the hint once a word is typed", () => {
    const { a } = lineOf("/hea", SLASH);

    expect(a?.hasAttribute("data-slash")).toBe(true);
    expect(a?.hasAttribute("data-slash-empty")).toBe(false);
  });

  it("is not marked without the slash menu", () => {
    const { a } = lineOf("/", null);

    expect(a?.hasAttribute("data-slash")).toBe(false);
  });
});
