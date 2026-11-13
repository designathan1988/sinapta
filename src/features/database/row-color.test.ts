import { describe, expect, it } from "vitest";
import { addColorRule, setColorRule } from "./color-rules.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { selectRowColor } from "./row-color.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";

// Rows "Late" (due long ago) and "Later" (no date), and rules set up as
// asked: each a condition on Due and a color.
function colors(
  rules: readonly { operator: string; color: "red" | "blue" | "green" }[],
) {
  const app = createDatabaseApp(
    [{ name: "Due", type: "date" }],
    [["Late", { start: "2020-01-01" }], ["Later"]],
  );
  const viewId = app.view().id;
  const [due] = app.propertyIds;
  if (due === undefined) throw new Error("setup");
  for (const rule of rules) {
    app.dispatch(addColorRule.create({ viewId }));
    const added = app.view().colorRules?.at(-1);
    if (added === undefined) throw new Error("no rule");
    const items =
      rule.operator === ""
        ? []
        : [{ propertyId: due, operator: rule.operator, value: "" }];
    const patch = {
      filter: { conjunction: "and" as const, items },
      color: rule.color,
    };
    app.dispatch(setColorRule.create({ viewId, ruleId: added.id, patch }));
  }
  const model = selectTableModel(
    app.store.getState(),
    app.databaseId,
    "2026-11-13",
  );
  if (model === undefined) throw new Error("no model");
  return model.rows.map((row) => [row.title, selectRowColor(model, row)]);
}

describe("selectRowColor", () => {
  it("gives the first matching rule's color", () => {
    expect(
      colors([
        { operator: "is-not-empty", color: "red" },
        { operator: "is-not-empty", color: "blue" },
        { operator: "is-empty", color: "green" },
      ]),
    ).toEqual([
      ["Late", "red"],
      ["Later", "green"],
    ]);
  });

  it("gives no color without a match, nor for a rule with no condition", () => {
    expect(colors([{ operator: "", color: "red" }])).toEqual([
      ["Late", undefined],
      ["Later", undefined],
    ]);
  });
});
