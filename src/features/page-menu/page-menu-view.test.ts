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
import { PAGE_RENAME_OVERLAY } from "./page-rename.view.ts";

// The page's menu, opened from the top bar or from another place.
function rendered(isResolved: boolean, place = "bar", openSubmenu?: string) {
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
  const overlay = {
    kind: PAGE_MENU_OVERLAY,
    anchorId,
    ...(openSubmenu !== undefined && {
      children: [{ anchorId: openSubmenu }],
    }),
  };
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

    expect(labels).toHaveLength(6);
    expect(labels[0]).toContain("Add to favorites");
    expect(labels.slice(1).map((label) => label.trim())).toEqual([
      expect.stringContaining("Copy link"),
      expect.stringContaining("Duplicate"),
      expect.stringContaining("Rename"),
      expect.stringContaining("Move to"),
      expect.stringContaining("Move to Trash"),
    ]);
    expect(host.querySelector(".page-menu__fonts")).toBeNull();
    expect(host.textContent).toContain("Edited");
  });

  it("renames the page from the sidebar beside its row, as Notion's", () => {
    const { sent, row } = rendered(false, "tree");

    row("Rename")?.click();

    expect(sent.at(-1)).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: PAGE_RENAME_OVERLAY, anchorId: "tree:page" },
    });
  });

  it("searches its actions", () => {
    const { host } = rendered(false);

    expect(host.querySelector("input")?.placeholder).toBe("Search actions…");
  });

  it("holds Notion's groups today, with More at the end", () => {
    const { rows } = rendered(false);

    const labels = rows.map((row) => row.textContent.trim());

    expect(labels).toEqual([
      expect.stringMatching(/^Copy link\s+Ctrl\+Alt\+L$/),
      expect.stringContaining("Copy page contents"),
      expect.stringMatching(/^Duplicate\s+Ctrl\+D$/),
      expect.stringMatching(/^Move to\s+Ctrl\+Shift\+P$/),
      expect.stringContaining("Version history"),
      expect.stringContaining("Updates & analytics"),
      expect.stringContaining("Appearance and layout"),
      expect.stringContaining("Suggest edits"),
      expect.stringContaining("Get notified"),
      expect.stringContaining("Lock page"),
      expect.stringContaining("Move to Trash"),
      expect.stringContaining("More"),
    ]);
  });

  it("keeps Export, Verify and Save as template under More, as Notion's", () => {
    const { host } = rendered(false, "bar", "more:page");

    const more = [...host.querySelectorAll(".menu")].at(-1)?.textContent ?? "";

    expect(more).toContain("Export");
    expect(more).toContain("Verify");
    expect(more).toContain("Save as template");
  });

  it("docks Updates & analytics beside the page", () => {
    const { sent, row } = rendered(false);

    row("Updates & analytics")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.showPageUpdates", pageId: "page" }),
    );
  });

  it("turns on suggesting for the page from Suggest edits", () => {
    const { sent, row } = rendered(false);

    row("Suggest edits")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.setSuggesting", pageId: "page" }),
    );
  });

  it("ends with the last edit over the word count", () => {
    const { host } = rendered(false);

    const foot = host.querySelector(".menu__footer")?.textContent ?? "";

    expect(foot).toMatch(/^Edited .+\n.*word/s);
  });

  it("chooses the page's style from three tiles in Appearance and layout", () => {
    const { host, sent } = rendered(false, "bar", "appearance:page");
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
    const { host } = rendered(false, "bar", "appearance:page");
    const row = (label: string) =>
      [...host.querySelectorAll("[role=menuitemcheckbox], [data-index]")].find(
        (element) => element.textContent.includes(label),
      );

    expect(row("Small text")?.querySelector(".switch")).not.toBeNull();
    expect(row("Full width")?.querySelector(".switch")).not.toBeNull();
  });

  it("opens Appearance and layout beside its row", () => {
    const { sent, row } = rendered(false);

    row("Appearance and layout")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "appearance:page",
      }),
    );
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
