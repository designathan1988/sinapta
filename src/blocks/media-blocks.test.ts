// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  parseAssetId,
  toBlockId,
  type Block,
} from "../model/index.ts";
import {
  createInitialState,
  createTestApp,
  type AppState,
} from "../state/index.ts";
import { audioDefinition } from "./audio/index.ts";
import type { BlockDefinition } from "./block-definition.ts";
import { fileDefinition } from "./file/index.ts";
import { pdfDefinition } from "./pdf/index.ts";
import { videoDefinition } from "./video/index.ts";

const ID = toBlockId("m");

function blockOf(definition: BlockDefinition, props: object): Block {
  return {
    id: ID,
    type: definition.type,
    parentId: toBlockId("page"),
    childIds: [],
    props: { url: "", caption: "", ...props },
    createdAt: "",
    updatedAt: "",
  };
}

// The address the block shows its file from, wherever its kind puts it.
function shownAddress(
  definition: BlockDefinition,
  block: Block,
  state: AppState,
) {
  const host = document.createElement("div");
  const view = definition.render?.(block, () => ({ ok: true }), state);
  if (view !== undefined) render(view, host);
  const element = host.querySelector("[data-media-source]");
  return element?.getAttribute("src") ?? element?.getAttribute("href");
}

describe.each([
  fileDefinition,
  pdfDefinition,
  videoDefinition,
  audioDefinition,
])("the $type block", (definition) => {
  it("shows a file from a web address", () => {
    const block = blockOf(definition, { url: "https://a.b/x" });

    expect(shownAddress(definition, block, createInitialState())).toBe(
      "https://a.b/x",
    );
  });

  it("shows a file kept in the asset store", () => {
    const assetId = parseAssetId("x");
    const initial = createInitialState();
    const state = {
      ...initial,
      persistence: { ...initial.persistence, assetUrls: { x: "blob:x" } },
    };
    const block = blockOf(definition, { assetId, name: "x", size: 3 });

    expect(shownAddress(definition, block, state)).toBe("blob:x");
  });

  function createApp() {
    const workspace = buildWorkspace([
      {
        id: "page",
        children: [
          { id: "m", type: definition.type, props: { url: "", caption: "" } },
        ],
      },
    ]);
    const app = createTestApp({
      workspace,
      commands: definition.commands ?? [],
    });
    const props = () => app.store.getState().workspace.blocks[ID]?.props;
    return { ...app, props };
  }

  it("refuses an address that is not https", () => {
    const { dispatch, props } = createApp();

    dispatch({
      type: `${definition.type}.setUrl`,
      blockId: ID,
      url: "http://a.b/x",
    });
    expect(props()?.url).toBe("");
    dispatch({
      type: `${definition.type}.setUrl`,
      blockId: ID,
      url: " https://a.b/x ",
    });
    expect(props()?.url).toBe("https://a.b/x");
  });

  it("edits its caption", () => {
    const { dispatch, props } = createApp();

    dispatch({
      type: `${definition.type}.setCaption`,
      blockId: ID,
      caption: "Notes",
    });

    expect(props()?.caption).toBe("Notes");
  });
});
