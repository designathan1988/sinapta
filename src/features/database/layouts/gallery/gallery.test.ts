import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../../../model/index.ts";
import { createInitialState } from "../../../../state/index.ts";
import { selectRowCover } from "./gallery.selectors.ts";

const workspace = buildWorkspace([
  {
    id: "row",
    children: [
      { id: "p", type: "paragraph", props: { text: [] } },
      { id: "empty", type: "image", props: { src: "", caption: "" } },
      {
        id: "img",
        type: "image",
        props: { src: "https://a.b/c.png", caption: "" },
      },
    ],
  },
  { id: "bare", children: [] },
]);
const state = { ...createInitialState(), workspace };

describe("selectRowCover", () => {
  it("is the first image on the row's page that has an address", () => {
    expect(selectRowCover(state, toBlockId("row"))).toBe("https://a.b/c.png");
  });

  it("is undefined for a page with no image", () => {
    expect(selectRowCover(state, toBlockId("bare"))).toBeUndefined();
  });
});
