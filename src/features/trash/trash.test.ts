import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { selectTrashParents, selectTrashRows } from "./trash.selectors.ts";

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

// Two trashed pages inside Projects, one at the top level.
function createState() {
  const workspace = buildWorkspace([
    {
      id: "projects",
      props: page("Projects"),
      children: [
        { id: "plan", props: page("Launch plan", true) },
        { id: "notes", props: page("Old notes", true) },
      ],
    },
    { id: "draft", props: page("Draft plan", true) },
  ]);
  return { ...createInitialState(), workspace };
}

const titles = (rows: readonly { readonly title: string }[]) =>
  rows.map((row) => row.title);

describe("the trash list", () => {
  it("finds trashed pages by title, showing where each was", () => {
    const rows = selectTrashRows(createState(), { query: "PLAN", inId: null });

    expect(rows.map((row) => [row.title, row.path])).toEqual([
      ["Draft plan", ""],
      ["Launch plan", "Projects"],
    ]);
  });

  it("keeps to the pages that were in one page", () => {
    const inId = toBlockId("projects");

    expect(titles(selectTrashRows(createState(), { query: "", inId }))).toEqual(
      ["Launch plan", "Old notes"],
    );
  });

  it("offers the pages trashed pages were in", () => {
    expect(selectTrashParents(createState())).toEqual([
      { id: "projects", title: "Projects" },
    ]);
  });
});
