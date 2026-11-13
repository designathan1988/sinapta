// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { parseBlockId, type BlockId } from "../../../../model/index.ts";
import type { AppState, Command } from "../../../../state/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setViewType } from "../../view-layout.commands.ts";
import { addColorRule } from "../../color-rules.commands.ts";

function newId(): BlockId {
  const id = parseBlockId(crypto.randomUUID());
  if (id === undefined) throw new Error("no id");
  return id;
}

// The row's page holds seven paragraphs, "Line 1" to "Line 7".
function withLines(state: AppState, rowId: BlockId): AppState {
  const blocks = { ...state.workspace.blocks };
  const ids = Array.from({ length: 7 }, newId);
  ids.forEach((id, index) => {
    blocks[id] = {
      id,
      type: "paragraph",
      parentId: rowId,
      childIds: [],
      props: { text: [{ text: `Line ${String(index + 1)}` }] },
      createdAt: "2026-11-11T00:00:00.000Z",
      updatedAt: "2026-11-11T00:00:00.000Z",
    };
  });
  const row = blocks[rowId];
  if (row !== undefined) blocks[rowId] = { ...row, childIds: ids };
  return { ...state, workspace: { ...state.workspace, blocks } };
}

function rendered() {
  const app = createDatabaseApp([], [["Weekly notes"]]);
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: "feed" }));
  const rowId = app.rowIds[0];
  if (rowId === undefined) throw new Error("setup");
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(withLines(app.store.getState(), rowId), (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent, rowId };
}

describe("the feed", () => {
  it("shows each row as a post with the first five blocks of its page", () => {
    const { host } = rendered();

    const post = host.querySelector(".feed__post");
    const lines = [...(post?.querySelectorAll(".feed__block") ?? [])];

    expect(post?.querySelector(".feed__title")?.textContent.trim()).toBe(
      "Weekly notes",
    );
    expect(lines.map((line) => line.textContent.trim())).toEqual([
      "Line 1",
      "Line 2",
      "Line 3",
      "Line 4",
      "Line 5",
    ]);
  });

  it("opens the row from its title", () => {
    const { host, sent, rowId } = rendered();

    host.querySelector<HTMLElement>(".feed__title")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "row.open", rowId }),
    ]);
  });
});

describe("a feed's conditional color", () => {
  it("colors the posts of rows a rule matches, as every layout", () => {
    const app = createDatabaseApp(
      [{ name: "Done", type: "checkbox" }],
      [["Weekly notes", true]],
    );
    const viewId = app.view().id;
    const [done] = app.propertyIds;
    if (done === undefined) throw new Error("setup");
    app.dispatch(setViewType.create({ viewId, viewType: "feed" }));
    const condition = { propertyId: done, operator: "is-checked", value: "" };
    app.dispatch(addColorRule.create({ viewId, condition }));
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase(app.store.getState(), () => ({ ok: true })),
      host,
    );

    expect(host.querySelector(".feed__post")?.getAttribute("data-color")).toBe(
      "green",
    );
  });
});
