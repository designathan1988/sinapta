import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { selectTableOfContents } from "./table-of-contents.selectors.ts";

function heading(id: string, level: number, text: string) {
  return { id, type: "heading", props: { level, text: [{ text }] } };
}

const workspace = buildWorkspace([
  {
    id: "page",
    children: [
      { id: "toc", type: "table-of-contents", props: {} },
      heading("h1", 1, "Intro"),
      {
        id: "toggle",
        type: "toggle",
        props: { text: [], isOpen: true },
        children: [heading("h2", 2, "Inside")],
      },
      { id: "sub", type: "page", children: [heading("h3", 1, "Other page")] },
    ],
  },
]);
const state = { ...createInitialState(), workspace };

describe("selectTableOfContents", () => {
  it("lists the page's headings in reading order, nested ones included", () => {
    expect(selectTableOfContents(state, toBlockId("toc"))).toEqual([
      { blockId: "h1", level: 1, text: "Intro" },
      { blockId: "h2", level: 2, text: "Inside" },
    ]);
  });

  it("lists nothing for a block that is not in the workspace", () => {
    expect(selectTableOfContents(state, toBlockId("none"))).toEqual([]);
  });
});
