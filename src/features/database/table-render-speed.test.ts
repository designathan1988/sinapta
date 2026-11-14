// @vitest-environment happy-dom
// The quality target of the specification: a table of 5,000 rows stays
// responsive. The table draws the rows in view only, so drawing it again
// after a cell changes takes a few frames at most, measured here from the
// changed state to the table drawn. The fastest of several runs is taken.
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { toBlockId, type Block } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";

const ROWS = 5000;
const BUDGET_MS = 50;

function largeTable(): { state: AppState; rows: Block[] } {
  const app = createDatabaseApp([{ name: "Points", type: "number" }], []);
  const [points] = app.propertyIds;
  if (points === undefined) throw new Error("setup");
  const built = app.store.getState();
  const rows: Block[] = Array.from({ length: ROWS }, (_, index) => ({
    id: toBlockId(`row-${String(index)}`),
    type: PAGE_TYPE,
    parentId: app.databaseId,
    childIds: [],
    props: {
      title: [{ text: `Row ${String(index)}` }],
      ...{ icon: null, isFavorite: false, isTrashed: false },
      values: { [points]: index },
    },
    createdAt: "2026-11-11T00:00:00.000Z",
    updatedAt: "2026-11-11T00:00:00.000Z",
  }));
  const database = built.workspace.blocks[app.databaseId];
  if (database === undefined) throw new Error("setup");
  const blocks = {
    ...built.workspace.blocks,
    ...Object.fromEntries(rows.map((row) => [row.id, row])),
    [app.databaseId]: { ...database, childIds: rows.map((row) => row.id) },
  };
  return {
    state: { ...built, workspace: { ...built.workspace, blocks } },
    rows,
  };
}

// The state with the first row renamed, as an edit in a cell leaves it.
function renamed(state: AppState, row: Block, title: string): AppState {
  const blocks = {
    ...state.workspace.blocks,
    [row.id]: { ...row, props: { ...row.props, title: [{ text: title }] } },
  };
  return { ...state, workspace: { ...state.workspace, blocks } };
}

describe("a table of 5,000 rows", () => {
  it("draws the rows in view and redraws a change within a few frames", () => {
    const { state, rows } = largeTable();
    const first = rows[0];
    if (first === undefined) throw new Error("setup");
    const host = document.createElement("div");
    const dispatch = () => ({ ok: true }) as const;
    render(renderDatabase(state, dispatch), host);
    const drawn = host.querySelectorAll("[data-row-id]").length;

    const times = Array.from({ length: 5 }, (_, index) => {
      const next = renamed(state, first, `Renamed ${String(index)}`);
      const start = performance.now();
      render(renderDatabase(next, dispatch), host);
      return performance.now() - start;
    });

    expect(drawn).toBeGreaterThan(0);
    expect(drawn).toBeLessThan(ROWS);
    expect(host.textContent).toContain("Renamed 4");
    expect(Math.min(...times)).toBeLessThan(BUDGET_MS);
  });
});
