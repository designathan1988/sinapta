import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../../../model/index.ts";
import { createInitialState } from "../../../../state/index.ts";
import { selectCardPicture } from "./row-card.selectors.ts";

function stateWith(kept: Record<string, string> = {}) {
  const workspace = buildWorkspace([
    {
      id: "row",
      props: { cover: "ocean" },
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
    {
      id: "kept",
      children: [
        {
          id: "file",
          type: "image",
          props: { src: "", caption: "", assetId: "asset-1" },
        },
      ],
    },
    { id: "bare", children: [] },
  ]);
  const initial = createInitialState();
  const persistence = { ...initial.persistence, assetUrls: kept };
  return { ...initial, workspace, persistence };
}

describe("selectCardPicture", () => {
  it("is the first image on the row's page that has an address", () => {
    expect(selectCardPicture(stateWith(), toBlockId("row"), "content")).toEqual(
      { src: "https://a.b/c.png" },
    );
  });

  it("shows an image kept as a file by its file's address", () => {
    const state = stateWith({ "asset-1": "blob:kept" });

    expect(selectCardPicture(state, toBlockId("kept"), "content")).toEqual({
      src: "blob:kept",
    });
  });

  it("is the page cover, or nothing when asked for none", () => {
    const state = stateWith();

    expect(selectCardPicture(state, toBlockId("row"), "cover")).toEqual({
      preset: "ocean",
    });
    expect(selectCardPicture(state, toBlockId("row"), "none")).toBeUndefined();
    expect(
      selectCardPicture(state, toBlockId("bare"), "content"),
    ).toBeUndefined();
  });
});
