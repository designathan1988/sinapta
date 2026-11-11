import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { bookmarkCommands, setBookmarkUrl } from "./bookmark.commands.ts";

const MARK = toBlockId("mark");

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "mark", type: "bookmark", props: { url: "" } }],
    },
  ]);
  const app = createTestApp({ workspace, commands: bookmarkCommands });
  const url = () => app.store.getState().workspace.blocks[MARK]?.props.url;
  return { ...app, url };
}

describe("bookmark.setUrl", () => {
  it("keeps a web address", () => {
    const { dispatch, url } = createApp();

    dispatch(
      setBookmarkUrl.create({ blockId: MARK, url: "https://example.com/docs" }),
    );

    expect(url()).toBe("https://example.com/docs");
  });

  it.each([
    "mailto:a@b.c",
    "javascript:alert(1)",
    "data:image/png;base64,AA==",
  ])("refuses %j", (address) => {
    const { dispatch, url } = createApp();

    dispatch(setBookmarkUrl.create({ blockId: MARK, url: address }));

    expect(url()).toBe("");
  });
});
