import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import {
  selectOpenSlashMenu,
  selectSlashItems,
  SLASH_MENU_OVERLAY,
} from "./slash-menu.selectors.ts";

const A = toBlockId("a");

function createState(text: string, caret: number, start = 0): AppState {
  const page = {
    title: [{ text: "Roadmap" }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
  };
  const workspace = buildWorkspace([
    {
      id: "page",
      props: page,
      children: [{ id: "a", type: "paragraph", props: { text: [{ text }] } }],
    },
  ]);
  const state = createInitialState();
  const ui = {
    ...state.ui,
    selection: { blockId: A, anchorOffset: caret, focusOffset: caret },
    overlay: { kind: SLASH_MENU_OVERLAY, anchorId: A, start },
  };
  return { ...state, workspace, ui };
}

describe("selectSlashItems", () => {
  it("offers every block type the user can pick, and no page type", () => {
    const labels = selectSlashItems(createInitialState(), "").map(
      (item) => item.label,
    );

    expect(labels).toContain("Text");
    expect(labels).toContain("Heading 3");
    expect(labels).toContain("Divider");
    expect(labels).toContain("Image");
    expect(labels).toContain("Table of contents");
    expect(labels).toHaveLength(15);
  });

  it("filters by the query without regard to case", () => {
    const labels = selectSlashItems(createInitialState(), "HEAD").map(
      (item) => item.label,
    );

    expect(labels).toEqual(["Heading 1", "Heading 2", "Heading 3"]);
  });

  it("offers links to pages whose title matches", () => {
    const items = selectSlashItems(createState("/", 1), "road");

    expect(items).toEqual([
      {
        label: "Link to page: Roadmap",
        blockType: "page-link",
        extraProps: { pageId: "page" },
      },
    ]);
  });
});

describe("selectOpenSlashMenu", () => {
  it("reads the query from the text between the slash and the caret", () => {
    const menu = selectOpenSlashMenu(createState("/quo", 4));

    expect(menu?.items.map((item) => item.label)).toEqual(["Quote"]);
    expect(menu).toMatchObject({ start: 0, end: 4, activeIndex: 0 });
  });

  it("is closed when the slash has been deleted", () => {
    expect(selectOpenSlashMenu(createState("quo", 3))).toBeUndefined();
  });

  it("is closed when nothing matches", () => {
    expect(selectOpenSlashMenu(createState("/zzz", 4))).toBeUndefined();
  });

  it("is closed when the caret is before the slash", () => {
    expect(selectOpenSlashMenu(createState("ab/", 1, 2))).toBeUndefined();
  });
});
