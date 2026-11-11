// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
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

function rendered(state: AppState = createInitialState()) {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderImage(block, dispatch, state), host);
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
