// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import type { BlockSpec } from "../../model/index.ts";
import type { Command, Dispatch } from "../../state/index.ts";
import {
  BLOCK_MENU_OVERLAY,
  renderBlockMenu,
} from "./editor-block-menu.view.ts";
import { createApp, text } from "./editor-builder.ts";

function choose(label: string, blocks: BlockSpec[] = [text("a", "Plan")]) {
  const { store } = createApp(blocks);
  const state = store.getState();
  const overlay = { kind: BLOCK_MENU_OVERLAY, anchorId: "a" };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(
    renderBlockMenu({ ...state, ui: { ...state.ui, overlay } }, dispatch),
    host,
  );
  const item = [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")].find(
    (element) => element.textContent.trim() === label,
  );
  item?.click();
  return { item, sent };
}

// The open block menu of a text block, its search holding the query.
function opened(query?: string) {
  const { store } = createApp([text("a", "Plan")]);
  const state = store.getState();
  const overlay = {
    kind: BLOCK_MENU_OVERLAY,
    anchorId: "a",
    ...(query !== undefined && { query }),
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderBlockMenu({ ...state, ui: { ...state.ui, overlay } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const rows = [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")];
  const textOf = (row: HTMLElement) =>
    row.textContent.replace(/\s+/g, " ").trim();
  return { host, sent, rows: rows.map(textOf) };
}

describe("the block menu", () => {
  it("searches its actions under the block's type, as Notion's", () => {
    const { host } = opened();

    expect(host.querySelector("input")?.placeholder).toBe("Search actions…");
    expect(host.querySelector(".menu__section")?.textContent.trim()).toBe(
      "Text",
    );
  });

  it("lists Notion's actions in its groups, with their keys", () => {
    const { host, rows } = opened();

    expect(rows.map((row) => row.replace(/\s+/g, " "))).toEqual([
      "Ask AI",
      "Turn into",
      "Color",
      "Copy link to block",
      "Duplicate Ctrl+D",
      "Move to",
      "Delete Del",
      "Comment Ctrl+Shift+M",
      "Turn into page",
      "Move to new column",
    ]);
    expect(host.querySelectorAll(".menu__divider")).toHaveLength(4);
  });

  it("keeps the actions that match what is typed", () => {
    expect(opened("dup").rows).toEqual(["Duplicate Ctrl+D"]);
  });

  it("follows what is typed in its search", () => {
    const { host, sent } = opened();
    const input = host.querySelector("input");
    if (input) input.value = "co";

    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.setOverlayQuery", query: "co" }),
    );
  });

  it("turns the block into a page", () => {
    const { sent } = choose("Turn into page");

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "block.turnIntoPage", blockId: "a" }),
    );
  });

  it("does not offer a page for a block inside another block", () => {
    const blocks = [{ ...text("b", "Outer"), children: [text("a", "Inner")] }];

    expect(choose("Turn into page", blocks).item).toBeUndefined();
  });

  it("puts the block in a new column", () => {
    const { sent } = choose("Move to new column", [
      text("b", "Before"),
      text("a", "Plan"),
    ]);

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "columns.moveToNewColumn",
        blockId: "a",
      }),
    );
  });

  it("copies a synced block as a reference to paste elsewhere", () => {
    const { sent } = choose("Copy and sync", [
      { id: "a", type: "synced-block", props: {} },
    ]);

    const copied = sent.find((command) => command.type === "ui.setClipboard");
    expect(copied).toMatchObject({
      clipboard: {
        blocks: [{ kind: "synced-block", depth: 0, text: [], sourceId: "a" }],
      },
    });
  });

  it("unsyncs a reference", () => {
    const { sent } = choose("Unsync", [
      { id: "s", type: "synced-block", props: {}, children: [text("c", "x")] },
      { id: "a", type: "synced-block", props: { sourceId: "s" } },
    ]);

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "syncedBlock.unsync",
        blockId: "a",
        blockCount: 1,
      }),
    );
  });

  it("opens the dialog to move the block to another page", () => {
    const { sent } = choose("Move to");

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "move-to", anchorId: "a" },
      }),
    );
  });

  it("copies a link that opens the page at the block", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    choose("Copy link to block");
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(
      expect.stringMatching(/#\/page\/page\?block=a$/),
    );
  });
});
