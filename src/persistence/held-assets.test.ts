import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../model/index.ts";
import { heldAssetIds } from "./held-assets.ts";

describe("heldAssetIds", () => {
  it("finds the assets of blocks and of files in row values", () => {
    const workspace = buildWorkspace([
      { id: "img", type: "image", props: { assetId: "photo" } },
      {
        id: "row",
        props: {
          values: {
            files: [
              { name: "plan.pdf", assetId: "plan" },
              { name: "site", url: "https://example.com" },
            ],
            note: "plain text",
          },
        },
      },
    ]);

    expect([...heldAssetIds(workspace)].sort()).toEqual(["photo", "plan"]);
  });
});
