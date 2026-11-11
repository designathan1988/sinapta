import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp, type PropertySpec } from "./database-builder.ts";
import { changePropertyType } from "./property-type.commands.ts";
import { selectOptionNamesFor } from "./property-type.selectors.ts";

const OPTIONS = [
  { id: "o1", name: "Todo", color: "gray" },
  { id: "o2", name: "Doing", color: "blue" },
];

// One property and its value in each row, given in row order.
function createApp(spec: PropertySpec, values: readonly unknown[]) {
  const app = createDatabaseApp(
    [spec],
    values.map((value, index) => [`Row ${String(index)}`, value]),
  );
  const [propertyId] = app.propertyIds;
  if (propertyId === undefined) throw new Error("setup");
  const property = () => app.database().props.properties[0];
  const valuesNow = () =>
    app.rowIds.map((rowId) => {
      const row = selectPage(app.store.getState(), rowId);
      return row?.props.values?.[propertyId];
    });
  const change = (propertyType: string) => {
    const target = { databaseId: app.databaseId, propertyId, propertyType };
    const optionNames = selectOptionNamesFor(app.store.getState(), target);
    app.dispatch(changePropertyType.create({ ...target, optionNames }));
  };
  return { app, property, values: valuesNow, change };
}

describe("changePropertyType", () => {
  it("makes an option of each different text, and gives rows theirs", () => {
    const { property, values, change } = createApp(
      { name: "Tag", type: "text" },
      ["Red", "Blue", "Red", ""],
    );

    change("select");

    const options = property()?.options ?? [];
    expect(property()?.type).toBe("select");
    expect(options.map((option) => option.name)).toEqual(["Red", "Blue"]);
    const [red, blue] = options.map((option) => option.id);
    expect(values()).toEqual([red, blue, red, undefined]);
  });

  it("splits text at commas into a multi-select's options", () => {
    const { property, values, change } = createApp(
      { name: "Tags", type: "text" },
      ["a, b", "b"],
    );

    change("multi-select");

    const options = property()?.options ?? [];
    expect(options.map((option) => option.name)).toEqual(["a", "b"]);
    const [a, b] = options.map((option) => option.id);
    expect(values()).toEqual([[a, b], [b]]);
  });

  it("keeps the options from a select to a multi-select and back", () => {
    const { property, values, change } = createApp(
      { name: "Stage", type: "select", options: OPTIONS },
      ["o2", "o1"],
    );

    change("multi-select");
    expect(values()).toEqual([["o2"], ["o1"]]);
    change("select");

    expect(property()?.options).toEqual(OPTIONS);
    expect(values()).toEqual(["o2", "o1"]);
  });

  it("turns options into their names as text", () => {
    const { property, values, change } = createApp(
      { name: "Stage", type: "select", options: OPTIONS },
      ["o2", undefined],
    );

    change("text");

    expect(property()?.type).toBe("text");
    expect(property()?.options).toBeUndefined();
    expect(values()).toEqual(["Doing", undefined]);
  });

  it("reads text as numbers and clears what is not one", () => {
    const { values, change } = createApp({ name: "Price", type: "text" }, [
      "12.5",
      "abc",
    ]);

    change("number");

    expect(values()).toEqual([12.5, undefined]);
  });

  it("leaves a property of the same type as it is", () => {
    const { app, change } = createApp({ name: "Tag", type: "text" }, ["a"]);
    const before = app.store.getState();

    change("text");

    expect(app.store.getState()).toBe(before);
  });
});
