import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
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
