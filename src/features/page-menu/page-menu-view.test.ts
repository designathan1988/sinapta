// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import {
  PAGE_MENU_OVERLAY,
  pageMenuAnchorId,
  renderPageMenu,
} from "./page-menu.view.ts";

function rendered(isResolved: boolean) {
  const discussion = {
    id: toBlockId("d1"),
    blockId: null,
    isResolved,
    comments: [
      { id: toBlockId("c1"), text: "Done", createdAt: "2026-11-10T12:00:00Z" },
    ],
  };
  const workspace = buildWorkspace([
    {
      id: "page",
      props: {
        title: [],
        icon: null,
        isFavorite: false,
        isTrashed: false,
        discussions: [discussion],
      },
    },
  ]);
  const initial = createInitialState();
  const anchorId = pageMenuAnchorId("bar", toBlockId("page"));
  const overlay = { kind: PAGE_MENU_OVERLAY, anchorId };
  const state = { ...initial, workspace, ui: { ...initial.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderPageMenu(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const item = [...host.querySelectorAll<HTMLElement>("[data-index]")].find(
    (row) => row.textContent.includes("Resolved comments"),
  );
  return { sent, item };
}

describe("the page menu", () => {
  it("opens the page's resolved comments, with their count", () => {
    const { sent, item } = rendered(true);

    item?.click();

    expect(item?.textContent).toContain("1");
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "resolved-comments", anchorId: "page" },
      }),
    );
  });

  it("leaves the row out while nothing is resolved", () => {
    expect(rendered(false).item).toBeUndefined();
  });
});
