import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  pageContent,
  pageHistoryCommands,
  restorePageVersion,
} from "./page-history.commands.ts";

const page = (title: string) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
});
const paragraph = (id: string, text: string) => ({
  id,
  type: "paragraph",
  props: { text: [{ text }] },
});

// The page as it was: a title and two paragraphs, beside a subpage.
const THEN = buildWorkspace([
  {
    id: "doc",
    props: page("Plan"),
    children: [
      paragraph("a", "First"),
      paragraph("b", "Second"),
      { id: "sub", props: page("Sub"), children: [paragraph("s1", "Inside")] },
    ],
  },
]);

// The page now: renamed, "b" deleted, "a" changed, "c" and a new subpage
// added.
const NOW = buildWorkspace([
  {
    id: "doc",
    props: page("Plan v2"),
    children: [
      paragraph("a", "First, edited"),
      paragraph("c", "Third"),
      { id: "sub", props: page("Sub"), children: [paragraph("s1", "Inside")] },
      { id: "later", props: page("Later") },
    ],
  },
]);

describe("a page version", () => {
  it("holds the page and its own blocks, not what subpages hold", () => {
    const ids = pageContent(THEN, toBlockId("doc")).map((block) => block.id);

    expect(ids).toEqual(["doc", "a", "b"]);
  });

  it("restores the page as it was, keeping subpages made since", () => {
    const app = createTestApp({
      workspace: NOW,
      commands: pageHistoryCommands,
    });
    const blocks = pageContent(THEN, toBlockId("doc"));

    app.dispatch(
      restorePageVersion.create({ pageId: toBlockId("doc"), blocks }),
    );

    const { blocks: after } = app.store.getState().workspace;
    expect(after[toBlockId("doc")]?.props.title).toEqual([{ text: "Plan" }]);
    expect(after[toBlockId("doc")]?.childIds).toEqual([
      "a",
      "b",
      "sub",
      "later",
    ]);
    expect(after[toBlockId("a")]?.props.text).toEqual([{ text: "First" }]);
    expect(after[toBlockId("b")]).toBeDefined();
    expect(after[toBlockId("c")]).toBeUndefined();
    expect(after[toBlockId("s1")]).toBeDefined();
  });
});
