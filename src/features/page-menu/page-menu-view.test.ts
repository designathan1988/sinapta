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

// The page's menu, opened from the top bar or from another place.
function rendered(isResolved: boolean, place = "bar") {
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
  const anchorId = pageMenuAnchorId(place, toBlockId("page"));
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
  const rows = [...host.querySelectorAll<HTMLElement>("[data-index]")];
  const row = (label: string) =>
    rows.find((element) => element.textContent.includes(label));
  const item = row("Resolved comments");
  return { sent, item, host, row, rows };
}

describe("the page menu, as Notion's", () => {
  it("keeps the sidebar's menu short: favorite, then the page's actions", () => {
    const { host, rows } = rendered(false, "tree");

    const labels = rows.map((row) => row.textContent);

    expect(labels).toHaveLength(5);
    expect(labels[0]).toContain("Add to favorites");
    expect(labels.slice(1).map((label) => label.trim())).toEqual([
      expect.stringContaining("Copy link"),
      expect.stringContaining("Duplicate"),
      expect.stringContaining("Move to"),
      expect.stringContaining("Move to trash"),
    ]);
    expect(host.querySelector(".page-menu__fonts")).toBeNull();
    expect(host.textContent).toContain("Edited");
  });

  it("searches its actions", () => {
    const { host } = rendered(false);

    expect(host.querySelector("input")?.placeholder).toBe("Search actions…");
  });

  it("chooses the page's style from three tiles", () => {
    const { host, sent } = rendered(false);
    const tiles = [
      ...host.querySelectorAll<HTMLButtonElement>(".page-menu__font"),
    ];

    tiles[1]?.click();

    expect(tiles.map((tile) => tile.getAttribute("aria-pressed"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    expect(sent).toContainEqual(
      expect.objectContaining({ type: "page.setFont", font: "serif" }),
    );
  });

  it("turns small text and full width on and off with switches", () => {
    const { row } = rendered(false);

    expect(row("Small text")?.querySelector(".switch")).not.toBeNull();
    expect(row("Full width")?.querySelector(".switch")).not.toBeNull();
  });

  it("copies the link and moves the page, and leaves moving up to keys", () => {
    const { row, host } = rendered(false);

    expect(row("Copy link")).toBeDefined();
    expect(row("Move to")).toBeDefined();
    expect(row("Move up")).toBeUndefined();
    expect(host.querySelectorAll(".menu__divider").length).toBeGreaterThan(2);
  });
});

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
