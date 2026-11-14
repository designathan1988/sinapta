import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { selectPageArchive } from "./page-archive.selectors.ts";

const page = (title: string) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
});

describe("a page's archive", () => {
  it("holds the page and its subpages, each in its parent's folder", () => {
    const workspace = buildWorkspace([
      {
        id: "plan",
        props: page("Plan"),
        children: [
          { id: "p", type: "paragraph", props: { text: [{ text: "Intro" }] } },
          {
            id: "sub",
            props: page("Sub"),
            children: [{ id: "deep", props: page("Deeper") }],
          },
          {
            id: "toggle",
            type: "toggle",
            props: { text: [] },
            children: [{ id: "twin", props: page("Sub") }],
          },
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    const files = selectPageArchive(state, toBlockId("plan"));

    expect(files.map((file) => file.path)).toEqual([
      "Plan.md",
      "Plan/Sub.md",
      "Plan/Sub/Deeper.md",
      "Plan/Sub 2.md",
    ]);
    expect(files[0]?.text).toContain("Intro");
  });
});

describe("a page's HTML archive", () => {
  it("holds HTML files in the same folders, as Notion's HTML export", () => {
    const workspace = buildWorkspace([
      {
        id: "plan",
        props: page("Plan"),
        children: [{ id: "sub", props: page("Sub") }],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    const files = selectPageArchive(state, toBlockId("plan"), "html");

    expect(files.map((file) => file.path)).toEqual([
      "Plan.html",
      "Plan/Sub.html",
    ]);
    expect(files[0]?.text).toContain("<html");
  });
});
