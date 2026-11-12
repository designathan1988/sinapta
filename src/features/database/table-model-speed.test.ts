import { describe, expect, it } from "vitest";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import {
  toBlockId,
  type Block,
  type BlockId,
  type PropertyId,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { setCalculation } from "./calculation.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { setPropertyConfig } from "./database.commands.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { setViewFilter, setViewSorts } from "./view.commands.ts";
import { setRelationTarget } from "./properties/relation/index.ts";

const ROWS = 5000;

// A database of 5,000 rows, grouped by stage, summed, sorted, filtered,
// with two formulas, and a rollup of the points of the two rows each row
// links to.
function largeView(): { state: AppState; databaseId: BlockId } {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [
          { id: "todo", name: "Todo", color: "gray" },
          { id: "done", name: "Done", color: "green" },
        ],
      },
      { name: "Points", type: "number" },
      { name: "Double", type: "formula" },
      { name: "Size", type: "formula" },
      { name: "Links", type: "relation" },
      { name: "Linked points", type: "rollup" },
    ],
    [],
  );
  const { databaseId } = app;
  const [stage, points, double, size, links, linked] = app.propertyIds;
  if (!stage || !points || !double || !size || !links || !linked)
    throw new Error("setup");
  const viewId = app.view().id;
  const formula = (propertyId: PropertyId, expression: string) =>
    setPropertyConfig.create({
      databaseId,
      propertyId,
      config: { expression },
    });
  app.dispatch(formula(double, 'prop("Points") * 2'));
  app.dispatch(formula(size, 'if(prop("Points") > 50, "big", "small")'));
  app.dispatch(
    setRelationTarget.create({
      databaseId,
      propertyId: links,
      targetId: databaseId,
      isTwoWay: false,
    }),
  );
  app.dispatch(
    setPropertyConfig.create({
      databaseId,
      propertyId: linked,
      config: {
        relationPropertyId: links,
        targetPropertyId: points,
        function: "sum",
      },
    }),
  );
  app.dispatch(setViewGroupBy.create({ viewId, propertyId: stage }));
  app.dispatch(
    setCalculation.create({ viewId, propertyId: points, kind: "sum" }),
  );
  app.dispatch(
    setViewSorts.create({
      viewId,
      sorts: [{ propertyId: linked, direction: "descending" }],
    }),
  );
  app.dispatch(
    setViewFilter.create({
      viewId,
      filter: {
        conjunction: "and",
        items: [{ propertyId: points, operator: "greater-than", value: "10" }],
      },
    }),
  );
  const built = app.store.getState();
  const rows: Block[] = Array.from({ length: ROWS }, (_, index) => ({
    id: toBlockId(`row-${String(index)}`),
    type: PAGE_TYPE,
    parentId: databaseId,
    childIds: [],
    props: {
      title: [{ text: `Row ${String(index)}` }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values: {
        [stage]: index % 2 === 0 ? "todo" : "done",
        [points]: index % 100,
        [links]: [1, 2].map((step) =>
          toBlockId(`row-${String((index + step) % ROWS)}`),
        ),
      },
    },
    createdAt: "2026-11-11T00:00:00.000Z",
    updatedAt: "2026-11-11T00:00:00.000Z",
  }));
  const database = built.workspace.blocks[databaseId];
  if (database === undefined) throw new Error("setup");
  const blocks = {
    ...built.workspace.blocks,
    ...Object.fromEntries(rows.map((row) => [row.id, row])),
    [databaseId]: { ...database, childIds: rows.map((row) => row.id) },
  };
  return {
    state: { ...built, workspace: { ...built.workspace, blocks } },
    databaseId,
  };
}

describe("a large view", () => {
  it("sorts, filters, groups and works out 5,000 rows in under 100 ms", () => {
    const { state, databaseId } = largeView();
    const times = Array.from({ length: 3 }, () => {
      const start = performance.now();
      const model = selectTableModel(state, databaseId, "2026-11-11");
      const elapsed = performance.now() - start;
      expect(model?.rows.length).toBe(4450);
      // Most linked points: the two rows after it hold 98 and 99.
      expect(Number(model?.rows[0]?.id.slice(4)) % 100).toBe(97);
      return elapsed;
    });

    expect(Math.min(...times)).toBeLessThan(100);
  });
});
