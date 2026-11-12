import { describe, expect, it } from "vitest";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
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

  it("makes an archive's subpages inside their pages, in one step", () => {
    const app = createTestApp({ commands: markdownImportCommands });
    const blocks = parseMarkdownBlocks("Hello\n");
    const deep = { title: "Deep", blocks: [], subpages: [] };
    const ideas = { title: "Ideas", blocks, subpages: [deep] };

    app.dispatch(
      importMarkdown.create({ title: "Plans", blocks, subpages: [ideas] }),
    );

    const state = app.store.getState();
    const titleOf = (id: BlockId | undefined) => {
      const page = selectPage(state, id ?? null);
      return page === undefined ? "" : selectPageTitle(page);
    };
    const plans = selectPage(state, state.workspace.rootIds[0] ?? null);
    const [hello, ideasId] = plans?.childIds ?? [];
    const ideasPage = selectPage(state, ideasId ?? null);
    expect(state.workspace.rootIds).toHaveLength(1);
    expect(hello && state.workspace.blocks[hello]?.type).toBe("paragraph");
    expect(titleOf(ideasId)).toBe("Ideas");
    expect(ideasPage?.parentId).toBe(plans?.id);
    expect(titleOf(ideasPage?.childIds[1])).toBe("Deep");
    expect(app.store.getState().history.undo).toHaveLength(1);
  });
});
