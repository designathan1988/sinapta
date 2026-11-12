import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { hashForBlock } from "../../ui/address/index.ts";
import { selectPaletteItems } from "./command-palette.selectors.ts";

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

function createState(): AppState {
  const workspace = buildWorkspace([
    {
      id: "a",
      props: page("Product Roadmap"),
      children: [{ id: "a1", props: page("Road trip") }],
    },
    { id: "b", props: page("Old road", true) },
    { id: "c", props: page("") },
  ]);
  return { ...createInitialState(), workspace };
}

const labels = (query: string) =>
  selectPaletteItems(createState(), query).map((item) => item.label);

describe("selectPaletteItems", () => {
  it("lists the actions for an empty query", () => {
    expect(labels("")).toContain("New page");
    expect(labels("").every((label) => !label.includes("Roadmap"))).toBe(true);
  });

  it("gives each action its own icon, as Notion's menus do", () => {
    const glyphs = selectPaletteItems(createState(), "")
      .filter((item) => item.kind === "action")
      .map((item) => item.glyph);

    expect(glyphs.every((glyph) => glyph !== undefined)).toBe(true);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it("finds pages by title without regard to case, nested ones too", () => {
    expect(labels("ROAD")).toEqual(["Product Roadmap", "Road trip"]);
  });

  it("leaves out pages in the trash", () => {
    expect(labels("old road")).toEqual([]);
  });

  it("finds an untitled page by its placeholder name", () => {
    expect(labels("untitled")).toEqual(["Untitled"]);
  });

  it("lists matching pages before matching actions", () => {
    const state = createState();
    const items = selectPaletteItems(state, "page");

    expect(items.map((item) => item.kind)).toEqual(["action"]);
    expect(selectPaletteItems(state, "t").at(0)?.kind).toBe("page");
  });

  it("gives every item a command to dispatch", () => {
    const item = selectPaletteItems(createState(), "roadmap")[0];

    expect(item?.command).toEqual({ type: "ui.setActivePage", pageId: "a" });
  });
});

describe("searching page text", () => {
  function stateWithText(): AppState {
    const workspace = buildWorkspace([
      {
        id: "notes",
        props: page("Meeting notes"),
        children: [
          {
            id: "p",
            type: "paragraph",
            props: {
              text: [
                { text: "We agreed to ship the Budget review next week." },
              ],
            },
          },
          { id: "child", props: page("Child"), children: [] },
        ],
      },
      { id: "budget", props: page("Budget 2027") },
    ]);
    return { ...createInitialState(), workspace };
  }

  it("finds a page by text in its blocks and shows the text around the match", () => {
    const items = selectPaletteItems(stateWithText(), "budget review");

    expect(items[0]).toMatchObject({
      kind: "content",
      label: "Meeting notes",
      detail: "…to ship the Budget review next week.",
    });
  });

  it("lists pages whose title matches before pages whose text matches", () => {
    const kinds = selectPaletteItems(stateWithText(), "budget").map(
      (item) => item.kind,
    );

    expect(kinds.slice(0, 2)).toEqual(["page", "content"]);
  });
});

describe("recent pages", () => {
  it("lists the pages opened last first, for an empty query", () => {
    const state = createState();
    const recentPageIds = [toBlockId("c"), toBlockId("a1")];
    const withRecents = { ...state, ui: { ...state.ui, recentPageIds } };

    const items = selectPaletteItems(withRecents, "");

    expect(items.slice(0, 2).map((item) => [item.section, item.label])).toEqual(
      [
        ["recent", "Untitled"],
        ["recent", "Road trip"],
      ],
    );
  });
});

describe("where a result is", () => {
  it("shows the pages a page is in", () => {
    const trip = selectPaletteItems(createState(), "trip")[0];

    expect(trip?.path).toBe("Product Roadmap");
  });

  it("opens a page found by its text at the block that matched", () => {
    const state = {
      ...createInitialState(),
      workspace: buildWorkspace([
        {
          id: "notes",
          props: page("Notes"),
          children: [
            {
              id: "p",
              type: "paragraph",
              props: { text: [{ text: "Ship it" }] },
            },
          ],
        },
      ]),
    };

    const found = selectPaletteItems(state, "ship")[0];

    expect(found?.href).toBe(hashForBlock(toBlockId("notes"), toBlockId("p")));
    expect(found?.match).toEqual({ start: 0, length: 4 });
  });

  it("finds by titles alone when asked", () => {
    const state = {
      ...createInitialState(),
      workspace: buildWorkspace([
        {
          id: "notes",
          props: page("Notes"),
          children: [
            {
              id: "p",
              type: "paragraph",
              props: { text: [{ text: "Road map" }] },
            },
          ],
        },
      ]),
    };

    const all = selectPaletteItems(state, "road");
    const titles = selectPaletteItems(state, "road", { isTitleOnly: true });

    expect(all.map((item) => item.kind)).toContain("content");
    expect(titles.map((item) => item.kind)).not.toContain("content");
  });
});
