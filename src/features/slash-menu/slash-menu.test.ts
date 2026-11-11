import { describe, expect, it } from "vitest";
import { createInitialState } from "../../state/index.ts";
import { createState } from "./slash-menu-builder.ts";
import {
  selectOpenSlashMenu,
  selectSlashItems,
} from "./slash-menu.selectors.ts";

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
    expect(labels).toContain("Page");
    expect(labels).toContain("Table");
    expect(labels).toContain("Block equation");
    expect(labels).toHaveLength(22);
  });

  it("filters by the query without regard to case", () => {
    const labels = selectSlashItems(createInitialState(), "HEAD").map(
      (item) => item.label,
    );

    expect(labels).toEqual([
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Heading 4",
      "Toggle heading 1",
      "Toggle heading 2",
      "Toggle heading 3",
    ]);
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

describe("color items", () => {
  it("offers text and background colors once something is typed", () => {
    const items = selectSlashItems(createInitialState(), "blue");

    expect(items).toEqual(
      expect.arrayContaining([
        { label: "Blue", color: "blue" },
        { label: "Blue background", color: "blue-background" },
      ]),
    );
  });

  it("offers the default color to remove one", () => {
    const items = selectSlashItems(createInitialState(), "default");

    expect(items).toContainEqual({ label: "Default", color: null });
  });

  it("keeps colors out of the list before anything is typed", () => {
    const items = selectSlashItems(createInitialState(), "");

    expect(items.some((item) => "color" in item)).toBe(false);
  });
});
