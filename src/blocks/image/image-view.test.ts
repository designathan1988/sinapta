// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { parseAssetId, toBlockId } from "../../model/index.ts";
import { installAssetSaver } from "../../ui/asset/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import type { ImageBlock } from "./image.schema.ts";
import { IMAGE_VIEWER_OVERLAY, renderImage } from "./image.view.ts";

const block: ImageBlock = {
  id: toBlockId("img"),
  type: "image",
  parentId: toBlockId("page"),
  childIds: [],
  props: { src: "https://a.b/c.png", caption: "Cat", width: 50 },
  createdAt: "",
  updatedAt: "",
};

function rendered(
  state: AppState = createInitialState(),
  shown: ImageBlock = block,
) {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderImage(shown, dispatch, state), host);
  const button = (label: string) =>
    host.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
  return { host, sent, button };
}

describe("renderImage", () => {
  it.each([
    ["ArrowRight", 55],
    ["ArrowLeft", 45],
    ["Home", 10],
    ["End", 100],
  ])("resizes with %s", (key, width) => {
    const { host, sent } = rendered();
    const handle = host.querySelector("[role=slider]");

    handle?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({ type: "image.setWidth", width }),
    ]);
  });

  it("follows the pointer while dragged, and keeps the width on release", () => {
    const { host, sent } = rendered();
    const figure = host.querySelector<HTMLElement>(".image");
    const handle = host.querySelector<HTMLElement>("[role=slider]");
    if (figure === null || handle === null) throw new Error("no handle");
    figure.getBoundingClientRect = () => new DOMRect(0, 0, 400, 300);
    handle.setPointerCapture = () => undefined;
    handle.hasPointerCapture = () => true;
    const pointer = (type: string, clientX: number) =>
      handle.dispatchEvent(
        new PointerEvent(type, { clientX, pointerId: 1, bubbles: true }),
      );

    pointer("pointerdown", 300);
    pointer("pointermove", 300);
    const dragged = figure.style.getPropertyValue("--image-width");
    pointer("pointerup", 350);

    // Centered: twice the distance from the middle, of the figure's width.
    expect(dragged).toBe("50%");
    expect(sent).toEqual([
      expect.objectContaining({ type: "image.setWidth", width: 75 }),
    ]);
  });

  it("aligns the image from its toolbar", () => {
    const { sent, button } = rendered();

    button("Align left")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "image.setAlign", align: "left" }),
    ]);
  });

  it("opens the image full screen", () => {
    const { sent, button } = rendered();

    button("View full screen")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: IMAGE_VIEWER_OVERLAY, anchorId: "img" },
      }),
    ]);
  });

  it("closes the full screen view when the dialog closes", () => {
    const initial = createInitialState();
    const overlay = { kind: IMAGE_VIEWER_OVERLAY, anchorId: "img" };
    const { host, sent } = rendered({
      ...initial,
      ui: { ...initial.ui, overlay },
    });
    const dialog = host.querySelector("dialog");
    if (dialog === null) throw new Error("no full screen view");
    dialog.setAttribute("open", "");

    // Escape closes a modal dialog in the browser; this is what follows.
    dialog.close();

    expect(dialog.querySelector("img")?.getAttribute("src")).toBe(
      "https://a.b/c.png",
    );
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });
});

describe("an image from a file", () => {
  const empty: ImageBlock = { ...block, props: { src: "", caption: "" } };

  it("keeps the chosen file as an asset of the block", async () => {
    const id = parseAssetId("cat");
    if (id === undefined) throw new Error("setup failed");
    installAssetSaver(() => Promise.resolve({ ok: true, id, url: "blob:cat" }));
    const { host, sent } = rendered(createInitialState(), empty);
    const input = host.querySelector<HTMLInputElement>("input[type=file]");
    if (input === null) throw new Error("no file field");
    const file = new File(["png"], "cat.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file] });

    input.dispatchEvent(new Event("change"));
    await Promise.resolve();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "asset.attach",
        blockId: "img",
        assetId: "cat",
        url: "blob:cat",
      }),
    ]);
  });

  it("says why the file could not be kept", () => {
    const initial = createInitialState();
    const assetError = { blockId: block.id, error: "quota-exceeded" as const };
    const state = {
      ...initial,
      persistence: { ...initial.persistence, assetError },
    };

    const { host } = rendered(state, empty);

    expect(host.textContent).toContain(
      COPY.blocks.assetErrors["quota-exceeded"],
    );
  });

  it("shows a stored asset from its address", () => {
    const initial = createInitialState();
    const state = {
      ...initial,
      persistence: { ...initial.persistence, assetUrls: { cat: "blob:cat" } },
    };
    const assetId = parseAssetId("cat");
    if (assetId === undefined) throw new Error("setup failed");
    const stored: ImageBlock = {
      ...block,
      props: { src: "", caption: "", assetId },
    };

    const { host } = rendered(state, stored);

    expect(host.querySelector(".image__picture")?.getAttribute("src")).toBe(
      "blob:cat",
    );
  });
});
