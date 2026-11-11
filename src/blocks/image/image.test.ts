import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  imageCommands,
  setImageCaption,
  setImageSource,
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
