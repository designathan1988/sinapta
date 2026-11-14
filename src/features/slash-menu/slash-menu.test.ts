import { describe, expect, it } from "vitest";
import { createInitialState } from "../../state/index.ts";
import { createState } from "./slash-menu-builder.ts";
import {
  selectOpenSlashMenu,
  selectSlashItems,
} from "./slash-menu.selectors.ts";

describe("selectSlashItems", () => {
  it("puts the closest match first, as Notion's", () => {
    const labels = selectSlashItems(createInitialState(), "toggle").map(
      (item) => item.label,
    );

    expect(labels[0]).toBe("Toggle");
    expect(labels.slice(1, 3)).toEqual([
      "Toggle heading 1",
      "Toggle heading 2",
    ]);
  });

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
    expect(labels).toContain("Breadcrumb");
    expect(labels).toEqual(
      expect.arrayContaining(["Video", "Audio", "File", "PDF"]),
    );
    expect(labels).toContain("Embed");
    expect(labels).toContain("Synced block");
    expect(labels).toContain("Button");
    expect(labels).toContain("Database");
    expect(labels).toContain("Linked view of database");
    expect(labels).toHaveLength(33);
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
        icon: "link",
        group: "pages",
      },
    ]);
  });

  it("gives each block its icon, its group and its Markdown shortcut", () => {
    const items = selectSlashItems(createInitialState(), "");
    const item = (label: string) => items.find((each) => each.label === label);

    expect(item("Heading 1")).toMatchObject({
      icon: "heading-1",
      group: "basic",
      hint: "#",
    });
    expect(item("To-do list")).toMatchObject({ icon: "checkbox", hint: "[]" });
    expect(item("Image")).toMatchObject({ icon: "image", group: "media" });
    expect(item("Table of contents")).toMatchObject({ group: "advanced" });
  });

  it("lists basic blocks, then media, databases and advanced ones", () => {
    const groups = selectSlashItems(createInitialState(), "").map(
      (item) => item.group,
    );

    expect([...new Set(groups)]).toEqual([
      "basic",
      "media",
      "database",
      "advanced",
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

  it("stays open with no items when nothing matches, as Notion's No results", () => {
    expect(selectOpenSlashMenu(createState("/zzz", 4))?.items).toEqual([]);
  });

  it("is closed when the caret is before the slash", () => {
    expect(selectOpenSlashMenu(createState("ab/", 1, 2))).toBeUndefined();
  });
});

describe("finding blocks as Notion's", () => {
  it.each([
    ["h2", "Heading 2"],
    ["todo", "To-do list"],
    ["bl", "Bulleted list"],
  ])("finds %s as %s first", (query, label) => {
    expect(selectSlashItems(createInitialState(), query)[0]?.label).toBe(label);
  });
});

describe("color items", () => {
  it("offers text and background colors once something is typed", () => {
    const items = selectSlashItems(createInitialState(), "blue");

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Blue", color: "blue" }),
        expect.objectContaining({
          label: "Blue background",
          color: "blue-background",
          group: "colors",
        }),
      ]),
    );
  });

  it("offers the default color to remove one", () => {
    const items = selectSlashItems(createInitialState(), "default");

    expect(items).toContainEqual(
      expect.objectContaining({ label: "Default", color: null }),
    );
  });

  it("keeps colors out of the list before anything is typed", () => {
    const items = selectSlashItems(createInitialState(), "");

    expect(items.some((item) => "color" in item)).toBe(false);
  });
});
