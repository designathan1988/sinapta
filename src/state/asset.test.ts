import { describe, expect, it } from "vitest";
import { buildWorkspace, parseAssetId, toBlockId } from "../model/index.ts";
import { assetCommands, attachAsset, failAsset } from "./asset.commands.ts";
import { selectAssetUrl } from "./asset.selectors.ts";
import { createTestApp } from "./state-builder.ts";

const IMAGE = toBlockId("img");
const CAT = parseAssetId("cat");

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "img", type: "image", props: { src: "", caption: "" } }],
    },
  ]);
  return createTestApp({ workspace, commands: assetCommands });
}

describe("asset.attach", () => {
  it("gives the block its stored asset and the address it shows from", () => {
    const { store, dispatch } = createApp();
    if (CAT === undefined) throw new Error("setup failed");

    dispatch(
      attachAsset.create({ blockId: IMAGE, assetId: CAT, url: "blob:cat" }),
    );

    const state = store.getState();
    expect(state.workspace.blocks[IMAGE]?.props.assetId).toBe("cat");
    expect(selectAssetUrl(state, CAT)).toBe("blob:cat");
  });
});

describe("asset.fail", () => {
  it("leaves the block as it was and says why", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;

    dispatch(failAsset.create({ blockId: IMAGE, error: "quota-exceeded" }));

    const state = store.getState();
    expect(state.workspace).toBe(before);
    expect(state.persistence.assetError).toEqual({
      blockId: IMAGE,
      error: "quota-exceeded",
    });
  });
});
