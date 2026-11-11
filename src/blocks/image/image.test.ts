import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  imageCommands,
  setImageAlign,
  setImageCaption,
  setImageSource,
  setImageWidth,
} from "./image.commands.ts";

const IMAGE = toBlockId("img");

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "img", type: "image", props: { src: "", caption: "" } }],
    },
  ]);
  const app = createTestApp({ workspace, commands: imageCommands });
  const props = () => app.store.getState().workspace.blocks[IMAGE]?.props;
  return { ...app, props };
}

describe("image.setSource", () => {
  it("shows an image from a web address", () => {
    const { dispatch, props } = createApp();

    dispatch(
      setImageSource.create({ blockId: IMAGE, src: " https://a.b/c.png " }),
    );

    expect(props()).toEqual({ src: "https://a.b/c.png", caption: "" });
  });

  it("refuses an address that is not an image source", () => {
    const { dispatch, props } = createApp();

    dispatch(
      setImageSource.create({ blockId: IMAGE, src: "javascript:alert(1)" }),
    );

    expect(props()).toEqual({ src: "", caption: "" });
  });
});

describe("image.setCaption", () => {
  it("sets the caption", () => {
    const { dispatch, props } = createApp();

    dispatch(setImageCaption.create({ blockId: IMAGE, caption: "A cat" }));

    expect(props()).toMatchObject({ caption: "A cat" });
  });
});

describe("image.setWidth", () => {
  it.each([
    [55, 55],
    [4, 10],
    [140, 100],
    [33.4, 33],
  ])("keeps a width of %d percent as %d", (width, kept) => {
    const { dispatch, props } = createApp();
    dispatch(setImageWidth.create({ blockId: IMAGE, width: 50 }));

    dispatch(setImageWidth.create({ blockId: IMAGE, width }));

    expect(props()?.width).toBe(kept);
  });
});

describe("resizing an image step by step", () => {
  it("is undone in one step", () => {
    const { dispatch, props } = createApp();
    for (const width of [95, 90, 85]) {
      dispatch(setImageWidth.create({ blockId: IMAGE, width }));
    }

    dispatch({ type: "history.undo" });

    expect(props()?.width).toBeUndefined();
  });
});

describe("image.setAlign", () => {
  it("aligns the image", () => {
    const { dispatch, props } = createApp();

    dispatch(setImageAlign.create({ blockId: IMAGE, align: "right" }));

    expect(props()?.align).toBe("right");
  });
});
