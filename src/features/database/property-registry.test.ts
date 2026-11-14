import { describe, expect, it } from "vitest";
import { BLOCK_PROPS_SCHEMAS } from "../../blocks/index.ts";
import { selectOptionSchema } from "../../blocks/database/index.ts";
import { parseWorkspaceFile, SCHEMA_VERSION } from "../../model/index.ts";
import { createDatabaseApp, toPropertyId } from "./database-builder.ts";
import {
  PROPERTY_TYPES,
  propertyType,
  withPropertyConfigs,
} from "./property-registry.ts";

const property = {
  id: toPropertyId("p"),
  name: "Stage",
  type: "select",
  options: [
    { id: "o1", name: "Todo", color: "gray" },
    { id: "o2", name: "Done", color: "green" },
  ],
};

function operator(type: string, id: string) {
  const found = propertyType(type).filterOperators.find(
    (item) => item.id === id,
  );
  if (found === undefined) throw new Error(`no operator ${id}`);
  return found;
}

describe("the property registry", () => {
  it("holds the seven property types of version 1 and the later ones", () => {
    expect(PROPERTY_TYPES.map((item) => item.type)).toEqual([
      "text",
      "number",
      "select",
      "multi-select",
      "status",
      "date",
      "checkbox",
      "url",
      "email",
      "phone",
      "files",
      "relation",
      "rollup",
      "formula",
      "button",
      "created-time",
      "edited-time",
      "person",
      "created-by",
      "edited-by",
      "place",
      "verification",
      "unique-id",
    ]);
  });

  it("reads an unknown type as text", () => {
    expect(propertyType("hologram").type).toBe("text");
  });
});

describe.each(PROPERTY_TYPES)("property type $type", (type) => {
  it("reads an empty cell as empty or unchecked", () => {
    expect(type.read(undefined) ?? false).toBe(false);
  });

  it("parses empty text as a cleared cell", () => {
    expect(type.parse("")).toBeUndefined();
  });

  it("offers at least one filter operator", () => {
    expect(type.filterOperators.length).toBeGreaterThan(0);
  });
});

describe("property values", () => {
  it.each([
    ["number", "12,5", 12.5],
    ["number", "abc", undefined],
    ["date", "2026-11-10", { start: "2026-11-10" }],
    ["date", "10/11/2026", undefined],
    ["date", "2026-13-45", undefined],
    ["url", "example.com/a", "https://example.com/a"],
    ["url", "javascript:alert(1)", undefined],
    ["checkbox", "true", true],
    ["text", "  kept as typed  ", "  kept as typed  "],
  ])("parses %s text %j", (type, text, expected) => {
    expect(propertyType(type).parse(text)).toEqual(expected);
  });

  it("ignores a stored value of the wrong kind", () => {
    expect(propertyType("number").read("12")).toBeUndefined();
    expect(propertyType("multi-select").read("o1")).toBeUndefined();
  });

  it("formats a select value as its option name", () => {
    expect(propertyType("select").format("o2", property)).toBe("Done");
    expect(propertyType("multi-select").format(["o1", "o2"], property)).toBe(
      "Todo, Done",
    );
  });

  it("orders numbers by value and text without regard to case", () => {
    expect(propertyType("number").compare(2, 10)).toBeLessThan(0);
    expect(propertyType("text").compare("apple", "Banana")).toBeLessThan(0);
    expect(propertyType("text").compare("item 2", "item 10")).toBeLessThan(0);
  });
});

describe("filter operators", () => {
  it.each([
    ["text", "contains", "Hello World", "WORLD", true],
    ["text", "contains", "Hello", "bye", false],
    ["text", "is-empty", undefined, "", true],
    ["number", "greater-than", 5, "3", true],
    ["number", "greater-than", undefined, "3", false],
    ["number", "equals", 2.5, "2,5", true],
    ["date", "before", { start: "2026-01-01" }, "2026-06-01", true],
    ["date", "after", { start: "2026-01-01" }, "2026-06-01", false],
    ["select", "is", "o1", "o1", true],
    ["select", "is-not", undefined, "o1", true],
    ["multi-select", "contains", ["o1", "o2"], "o2", true],
    ["multi-select", "does-not-contain", ["o1"], "o2", true],
    ["checkbox", "is-checked", true, "", true],
    ["checkbox", "is-not-checked", undefined, "", true],
  ] as const)("%s %s", (...row) => {
    const [type, id, value, operand, expected] = row;

    expect(operator(type, id).test(value, operand)).toBe(expected);
  });
});

// A stored workspace whose database's properties carry these configs, in
// property order; undefined leaves a property without one.
function storedWithConfigs(configs: readonly unknown[]) {
  const app = createDatabaseApp(
    [
      { name: "Stage", type: "select" },
      { name: "Size", type: "number" },
      { name: "Notes", type: "text" },
    ],
    [["First"]],
  );
  const database = app.database();
  const properties = database.props.properties.map((each, index) =>
    configs[index] === undefined ? each : { ...each, config: configs[index] },
  );
  const { workspace } = app.store.getState();
  const blocks = {
    ...workspace.blocks,
    [database.id]: { ...database, props: { ...database.props, properties } },
  };
  const file = { schemaVersion: SCHEMA_VERSION, ...workspace, blocks };
  const json: unknown = JSON.parse(JSON.stringify(file));
  return { databaseId: database.id, json };
}

// Configs checked with the shape of a select option, so that the test
// needs no schema of its own.
const SCHEMAS = withPropertyConfigs(
  BLOCK_PROPS_SCHEMAS,
  new Map([
    ["select", selectOptionSchema],
    ["number", selectOptionSchema],
  ]),
);

describe("property configs on load", () => {
  it("skips and counts a property whose config does not fit its type", () => {
    const option = { id: "o1", name: "Open", color: "gray" };
    const { databaseId, json } = storedWithConfigs([option, { id: 7 }]);

    const result = parseWorkspaceFile(json, SCHEMAS);

    if (!result.ok) throw new Error("the file did not load");
    const database = result.workspace.blocks[databaseId];
    expect(database?.props.properties).toMatchObject([
      { name: "Stage", config: option },
      { name: "Notes" },
    ]);
    expect(result.skipped).toEqual([
      {
        kind: "invalid-record",
        recordId: databaseId,
        path: "props.properties.1.config",
      },
    ]);
  });

  it("keeps properties without a config and the database's rows", () => {
    const { databaseId, json } = storedWithConfigs([]);

    const result = parseWorkspaceFile(json, SCHEMAS);

    expect(result).toMatchObject({ ok: true, skipped: [] });
    if (!result.ok) return;
    expect(result.workspace.blocks[databaseId]?.childIds).toHaveLength(1);
    expect(result.workspace.blocks[databaseId]?.props.properties).toHaveLength(
      3,
    );
  });
});
