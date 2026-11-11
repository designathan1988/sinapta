import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectRecentPages, selectUpcoming } from "./home.selectors.ts";

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

function row(id: string, due: string, isTrashed = false) {
  return {
    id,
    props: { ...page(id, isTrashed), values: { due: { start: due } } },
  };
}

function createState(recent: string[]): AppState {
  const workspace = buildWorkspace([
    { id: "a", props: page("Alpha") },
    { id: "gone", props: page("Gone", true) },
    {
      id: "db",
      type: "database",
      props: {
        ...page("Tasks"),
        properties: [{ id: "due", name: "Due", type: "date" }],
        viewIds: [],
        templateIds: [],
        defaultTemplateId: null,
      },
      children: [
        row("today", "2026-11-11"),
        row("next-week", "2026-11-18"),
        row("too-late", "2026-11-19"),
        row("yesterday", "2026-11-10"),
        row("tomorrow", "2026-11-12"),
        row("trashed", "2026-11-12", true),
      ],
    },
  ]);
  const initial = createInitialState();
  const recentPageIds = recent.map(toBlockId);
  return { ...initial, workspace, ui: { ...initial.ui, recentPageIds } };
}

describe("selectRecentPages", () => {
  it("lists recent pages newest first and skips trashed or missing ones", () => {
    const state = createState(["gone", "a", "missing", "db"]);

    expect(selectRecentPages(state).map((p) => p.id)).toEqual(["a", "db"]);
  });
});

describe("selectUpcoming", () => {
  it("lists dates from today to a week ahead, soonest first", () => {
    const upcoming = selectUpcoming(createState([]), "2026-11-11");

    expect(upcoming.map((item) => [item.title, item.date])).toEqual([
      ["today", "2026-11-11"],
      ["tomorrow", "2026-11-12"],
      ["next-week", "2026-11-18"],
    ]);
    expect(upcoming[0]?.propertyName).toBe("Due");
  });
});
