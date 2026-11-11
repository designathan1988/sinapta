import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectTreeRows } from "./sidebar.selectors.ts";

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

function createState(ui: Partial<AppState["ui"]> = {}): AppState {
  const workspace = buildWorkspace([
    {
      id: "a",
      props: page("Alpha"),
      children: [
        { id: "a1", props: page("Child") },
        { id: "a2", props: page("Gone", true) },
      ],
    },
    { id: "b", props: page("") },
  ]);
  const state = createInitialState();
  return { ...state, workspace, ui: { ...state.ui, ...ui } };
}

describe("selectTreeRows", () => {
  it("lists top-level pages and hides children of collapsed pages", () => {
    const rows = selectTreeRows(createState());

    expect(rows.map((row) => [row.title, row.level])).toEqual([
      ["Alpha", 1],
      ["", 1],
    ]);
  });

  it("lists the children of an expanded page one level deeper", () => {
    const rows = selectTreeRows(
      createState({ expandedPageIds: [toBlockId("a")] }),
    );

    expect(rows.map((row) => [row.title, row.level])).toEqual([
      ["Alpha", 1],
      ["Child", 2],
      ["", 1],
    ]);
  });

  it("leaves out trashed pages and does not count them as children", () => {
    const rows = selectTreeRows(
      createState({ expandedPageIds: [toBlockId("a"), toBlockId("a1")] }),
    );

    expect(rows.map((row) => row.title)).not.toContain("Gone");
    expect(rows[1]?.hasChildren).toBe(false);
  });

  it("marks the active page and makes it the tab stop", () => {
    const rows = selectTreeRows(createState({ activePageId: toBlockId("b") }));

    expect(rows.map((row) => row.isActive)).toEqual([false, true]);
    expect(rows.map((row) => row.isTabStop)).toEqual([false, true]);
  });

  it("makes the first row the tab stop when no visible page is active", () => {
    const rows = selectTreeRows(createState());

    expect(rows.map((row) => row.isTabStop)).toEqual([true, false]);
  });

  it("tells a database from a page", () => {
    const workspace = buildWorkspace([
      { id: "p", props: page("Notes") },
      {
        id: "d",
        type: "database",
        props: {
          ...page("Tasks"),
          properties: [],
          viewIds: [],
          templateIds: [],
          defaultTemplateId: null,
        },
      },
    ]);
    const rows = selectTreeRows({ ...createInitialState(), workspace });

    expect(rows.map((row) => row.isDatabase)).toEqual([false, true]);
  });
});
