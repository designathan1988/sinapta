import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import { linkMentionText, pasteAs } from "./editor-paste-as.commands.ts";

const A = toBlockId("a");
const HREF = "https://www.youtube.com/watch?v=abc";

function first(app: ReturnType<typeof createApp>) {
  const { blocks } = app.store.getState().workspace;
  const id = blocks[PAGE]?.childIds[0];
  return id === undefined ? undefined : blocks[id];
}

describe("Paste as", () => {
  it("names a page's mention by its address without the scheme", () => {
    expect(linkMentionText("https://www.github.com/notion/")).toBe(
      "github.com/notion",
    );
    expect(linkMentionText("https://example.com/")).toBe("example.com");
  });

  it("makes the pasted link a mention of the page", () => {
    const app = createApp([text("a", "see link")]);

    app.dispatch(
      pasteAs({ blockId: A, start: 4, end: 8, href: HREF }, "mention"),
    );

    expect(first(app)?.props.text).toEqual([
      { text: "see " },
      {
        text: "youtube.com/watch",
        mention: { kind: "link", href: HREF },
      },
    ]);
  });

  it("turns a line holding only the link into a bookmark", () => {
    const app = createApp([text("a", "link")]);

    app.dispatch(
      pasteAs({ blockId: A, start: 0, end: 4, href: HREF }, "bookmark"),
    );

    expect(first(app)).toMatchObject({
      type: "bookmark",
      props: { url: HREF },
    });
  });

  it("embeds a page of a host that can be framed", () => {
    const app = createApp([text("a", "link")]);

    app.dispatch(
      pasteAs({ blockId: A, start: 0, end: 4, href: HREF }, "embed"),
    );

    expect(first(app)).toMatchObject({ type: "embed", props: { url: HREF } });
  });

  it("does not embed a host that cannot be framed", () => {
    const app = createApp([text("a", "link")]);
    const href = "https://example.com/";

    app.dispatch(pasteAs({ blockId: A, start: 0, end: 4, href }, "embed"));

    expect(first(app)?.type).toBe("paragraph");
  });
});
