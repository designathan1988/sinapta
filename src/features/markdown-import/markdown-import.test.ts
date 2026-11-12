import { describe, expect, it } from "vitest";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import { createTestApp } from "../../state/index.ts";
import { parseMarkdownBlocks } from "../../ui/rich-text/index.ts";
import {
  importMarkdown,
  markdownImportCommands,
} from "./markdown-import.commands.ts";

describe("importing Markdown", () => {
  it("makes a page named by its file, its blocks nested as written", () => {
    const app = createTestApp({ commands: markdownImportCommands });
    const blocks = parseMarkdownBlocks(
      "## Goals\n- Ship\n  - Test it\n- Rest\n",
    );

    app.dispatch(importMarkdown.create({ title: "Notes", blocks }));

    const state = app.store.getState();
    const page = selectPage(state, state.workspace.rootIds[0] ?? null);
    const kinds = (page?.childIds ?? []).map(
      (id) => state.workspace.blocks[id]?.type,
    );
    const shipId = page?.childIds[1];
    const ship =
      shipId === undefined ? undefined : state.workspace.blocks[shipId];
    expect(page === undefined ? "" : selectPageTitle(page)).toBe("Notes");
    expect(kinds).toEqual(["heading", "bulleted-list", "bulleted-list"]);
    expect(ship?.childIds).toHaveLength(1);
    expect(state.ui.activePageId).toBe(page?.id);
  });
});
