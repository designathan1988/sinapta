import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import {
  setLinkMentionTitle,
  setLinkPreview,
} from "./link-preview.commands.ts";
import { createTestApp } from "./state-builder.ts";

const PREVIEW = {
  title: "MDN",
  description: "Docs",
  image: null,
  icon: null,
};

function app() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [] },
      children: [
        { id: "mark", type: "bookmark", props: { url: "https://a.test/" } },
      ],
    },
  ]);
  return createTestApp({ workspace, commands: [setLinkPreview] });
}

describe("setLinkPreview", () => {
  it("keeps the page's preview on the bookmark of that address", () => {
    const { store, dispatch } = app();

    dispatch(
      setLinkPreview.create({
        blockId: toBlockId("mark"),
        url: "https://a.test/",
        preview: PREVIEW,
      }),
    );

    expect(
      store.getState().workspace.blocks[toBlockId("mark")]?.props.preview,
    ).toEqual(PREVIEW);
  });

  it("drops a preview read for an address the bookmark no longer has", () => {
    const { store, dispatch } = app();

    dispatch(
      setLinkPreview.create({
        blockId: toBlockId("mark"),
        url: "https://old.test/",
        preview: PREVIEW,
      }),
    );

    expect(
      store.getState().workspace.blocks[toBlockId("mark")]?.props.preview,
    ).toBeUndefined();
  });
});

describe("setLinkMentionTitle", () => {
  it("shows the page's title in its mentions, once", () => {
    const href = "https://github.com/notion";
    const mention = { kind: "link", href };
    const workspace = buildWorkspace([
      {
        id: "page",
        props: { title: [] },
        children: [
          {
            id: "line",
            type: "paragraph",
            props: {
              text: [{ text: "See " }, { text: "github.com/notion", mention }],
            },
          },
        ],
      },
    ]);
    const { store, dispatch } = createTestApp({
      workspace,
      commands: [setLinkMentionTitle],
    });
    const blockId = toBlockId("line");

    dispatch(setLinkMentionTitle.create({ blockId, href, title: "Notion" }));
    dispatch(setLinkMentionTitle.create({ blockId, href, title: "Again" }));

    expect(store.getState().workspace.blocks[blockId]?.props.text).toEqual([
      { text: "See " },
      { text: "Notion", mention: { kind: "link", href, isTitled: true } },
    ]);
  });
});
