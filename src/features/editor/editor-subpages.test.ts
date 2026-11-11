import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { selectContentBlocks } from "./editor.selectors.ts";

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

describe("selectContentBlocks", () => {
  it("shows subpages where they sit among the blocks, without trashed ones", () => {
    const workspace = buildWorkspace([
      {
        id: "page",
        props: page("Plan"),
        children: [
          { id: "a", type: "paragraph", props: { text: [] } },
          { id: "sub", props: page("Notes") },
          { id: "gone", props: page("Old", true) },
          { id: "b", type: "paragraph", props: { text: [] } },
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    const ids = selectContentBlocks(state, toBlockId("page")).map((b) => b.id);

    expect(ids).toEqual(["a", "sub", "b"]);
  });
});
