// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import type { Command, Dispatch } from "../../state/index.ts";
import { selectPage } from "./page.selectors.ts";
import { renderPageRow } from "./page-row.view.ts";
import { createInitialState } from "../../state/index.ts";

function rendered() {
  const props = {
    title: [{ text: "Notes" }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
  };
  const state = {
    ...createInitialState(),
    workspace: buildWorkspace([{ id: "sub", props }]),
  };
  const page = selectPage(state, toBlockId("sub"));
  if (page === undefined) throw new Error("The builder lost the page.");
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderPageRow(page, dispatch), host);
  const row = host.querySelector<HTMLElement>("button");
  return { row, sent };
}

describe("renderPageRow", () => {
  it("opens the subpage when it is pressed", () => {
    const { row, sent } = rendered();

    row?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.setActivePage", pageId: "sub" }),
    ]);
  });

  it("moves the subpage to the trash with Backspace", () => {
    const { row, sent } = rendered();

    row?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({ type: "page.trash", pageId: "sub" }),
    ]);
  });
});
