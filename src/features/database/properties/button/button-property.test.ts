import { describe, expect, it } from "vitest";
import {
  isToday,
  readButtonPropertyConfig,
  variableOf,
} from "./button-property.schema.ts";

describe("readButtonPropertyConfig", () => {
  it("keeps the label and every action, in their order", () => {
    const config = readButtonPropertyConfig({
      label: "Go",
      actions: [
        {
          kind: "define-variables",
          variables: [{ name: "x", expression: "1" }],
        },
        { kind: "confirm", message: "Sure?" },
        { kind: "set-values", values: { status: "Done" } },
        { kind: "add-page", databaseId: "db", values: {} },
        { kind: "edit-pages", databaseId: "db", values: {} },
        { kind: "open-page", url: "https://example.com" },
      ],
    });

    expect(config.label).toBe("Go");
    expect(config.actions.map((action) => action.kind)).toEqual([
      "define-variables",
      "confirm",
      "set-values",
      "add-page",
      "edit-pages",
      "open-page",
    ]);
  });

  it("reads a config it cannot check as an empty button", () => {
    const config = readButtonPropertyConfig({
      label: "Go",
      actions: [{ kind: "unknown" }],
    });
    expect(config).toEqual({ label: "", actions: [] });
  });
});

describe("the values a button sets", () => {
  it("tells the day of the press and a variable apart", () => {
    expect(isToday({ today: true })).toBe(true);
    expect(isToday("2026-11-13")).toBe(false);
    expect(variableOf({ variable: "total" })).toBe("total");
    expect(variableOf(3)).toBeUndefined();
  });
});
