import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../../../blocks/database/index.ts";
import {
  renamePage,
  selectPage,
  trashPage,
} from "../../../../blocks/page/index.ts";
import { toBlockId } from "../../../../model/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { propertyType } from "../../property-registry.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import {
  addProperty,
  createDatabase,
  setPropertyConfig,
} from "../../database.commands.ts";
import { addRow, setRowValue } from "../../row.commands.ts";
import { setRelationTarget, setRelationValue } from "../relation/index.ts";
import type { RollupFunction } from "./rollup.schema.ts";
import { selectRollup } from "./rollup.selectors.ts";

const OPTIONS = [
  { id: "a", name: "A", color: "gray" },
  { id: "b", name: "B", color: "blue" },
];

// Five items: price, done, due and tag, some of them empty.
const ITEMS = [
  [10, true, { start: "2026-01-05" }, "a"],
  [20, false, { start: "2026-01-01", end: "2026-01-03" }, "b"],
  [30, true, undefined, "a"],
  [undefined, true, { start: "2026-02-01" }, undefined],
  [40, false, { start: "2026-01-10" }, "a"],
] as const;

function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Price", type: "number" },
      { name: "Done", type: "checkbox" },
      { name: "Due", type: "date" },
      { name: "Tag", type: "select", options: OPTIONS },
    ],
    ITEMS.map((values, index) => [`Item ${String(index)}`, ...values]),
  );
  const items = app.databaseId;
  app.dispatch(createDatabase.create({ parentId: null }));
  const orders = app.store.getState().ui.activePageId;
  if (orders === null) throw new Error("no orders");
  const add = (type: string, name: string) => {
    app.dispatch(
      addProperty.create({ databaseId: orders, propertyType: type, name }),
    );
    const id = selectDatabase(
      app.store.getState(),
      orders,
    )?.props.properties.at(-1)?.id;
    if (id === undefined) throw new Error("no property");
    return id;
  };
  const relation = add("relation", "Items");
  const rollup = add("rollup", "Total");
  app.dispatch(
    setRelationTarget.create({
      databaseId: orders,
      propertyId: relation,
      targetId: items,
      isTwoWay: false,
    }),
  );
  app.dispatch(addRow.create({ databaseId: orders }));
  const order = selectDatabase(app.store.getState(), orders)?.childIds[0];
  if (order === undefined) throw new Error("no order");
  app.dispatch(renamePage.create({ pageId: order, title: "Order" }));
  app.dispatch(
    setRelationValue.create({
      rowId: order,
      propertyId: relation,
      value: [...app.rowIds, toBlockId("missing")],
    }),
  );
  const [price, done, due, tag] = app.propertyIds;
  const targets: Record<string, string | undefined> = { price, done, due, tag };
  const roll = (fn: RollupFunction, target: string) => {
    const config = {
      relationPropertyId: relation,
      targetPropertyId: targets[target] ?? target,
      function: fn,
    };
    app.dispatch(
      setPropertyConfig.create({
        databaseId: orders,
        propertyId: rollup,
        config,
      }),
    );
    const property = selectDatabase(
      app.store.getState(),
      orders,
    )?.props.properties.find((item) => item.id === rollup);
    if (property === undefined) throw new Error("no rollup");
    return selectRollup(app.store.getState(), order, property);
  };
  return { ...app, roll, order, relation };
}

describe("the rollup property", () => {
  it("shows its value in the rows of the table", () => {
    const app = createApp();
    const result = app.roll("sum", "price");
    const state = app.store.getState();
    const orders = selectPage(state, app.order)?.parentId ?? null;
    const model = orders === null ? undefined : selectTableModel(state, orders);
    const rollup = model?.database.props.properties[1];
    if (rollup === undefined) throw new Error("no rollup column");

    expect(model?.rows[0]?.values[rollup.id]).toEqual(result);
    expect(propertyType("rollup").format(result, rollup)).toBe("100");
  });
});

describe("selectRollup", () => {
  it.each([
    ["count-all", "price", 5],
    ["count-values", "price", 4],
    ["count-unique", "tag", 2],
    ["count-empty", "price", 1],
    ["count-not-empty", "price", 4],
    ["sum", "price", 100],
    ["average", "price", 25],
    ["median", "price", 25],
    ["min", "price", 10],
    ["max", "price", 40],
    ["range", "price", 30],
    ["checked", "done", 3],
    ["unchecked", "done", 2],
  ] as const)("%s of %s is %d", (fn, target, expected) => {
    expect(createApp().roll(fn, target)).toEqual({
      kind: "number",
      value: expected,
    });
  });

  it.each([
    ["percent-empty", "price", 0.2],
    ["percent-not-empty", "price", 0.8],
    ["percent-checked", "done", 0.6],
    ["percent-unchecked", "done", 0.4],
  ] as const)("%s of %s is %d", (fn, target, expected) => {
    expect(createApp().roll(fn, target)).toEqual({
      kind: "percent",
      value: expected,
    });
  });

  it("finds the earliest and latest dates and the range between", () => {
    const app = createApp();

    expect(app.roll("earliest-date", "due")).toEqual({
      kind: "date",
      value: { start: "2026-01-01" },
    });
    expect(app.roll("latest-date", "due")).toEqual({
      kind: "date",
      value: { start: "2026-02-01" },
    });
    expect(app.roll("date-range", "due")).toEqual({
      kind: "date",
      value: { start: "2026-01-01", end: "2026-02-01" },
    });
  });

  it("shows the related values as they are written, or each once", () => {
    const app = createApp();

    expect(app.roll("show-original", "tag")).toEqual({
      kind: "list",
      value: ["A", "B", "A", "A"],
    });
    expect(app.roll("show-unique", "tag")).toEqual({
      kind: "list",
      value: ["A", "B"],
    });
    expect(app.roll("show-original", "title")).toMatchObject({
      kind: "list",
      value: ["Item 0", "Item 1", "Item 2", "Item 3", "Item 4"],
    });
  });

  it("follows later values and ignores a related row in the trash", () => {
    const app = createApp();
    const [first, , , , last] = app.rowIds;
    const price = app.propertyIds[0];
    if (first === undefined || last === undefined || price === undefined) {
      throw new Error("setup");
    }

    app.dispatch(
      setRowValue.create({ rowId: first, propertyId: price, value: 50 }),
    );
    app.dispatch(trashPage.create({ pageId: last }));

    expect(app.roll("sum", "price")).toEqual({ kind: "number", value: 100 });
    expect(app.roll("count-all", "price")).toEqual({
      kind: "number",
      value: 4,
    });
  });

  it("is empty without a relation or a target", () => {
    expect(createApp().roll("sum", "nothing")).toBeUndefined();
  });
});
