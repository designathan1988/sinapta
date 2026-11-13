// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { addColorRule, setColorRule } from "./color-rules.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";

// A table of a ticked row and an unticked one, whose view colors ticked
// rows red when asked.
function tableRows(colored: boolean) {
  const app = createDatabaseApp(
    [{ name: "Finished", type: "checkbox" }],
    [["Done", true], ["Open"]],
  );
  const viewId = app.view().id;
  const [finished] = app.propertyIds;
  if (finished === undefined) throw new Error("setup");
  if (colored) {
    app.dispatch(addColorRule.create({ viewId }));
    const rule = app.view().colorRules?.[0];
    if (rule === undefined) throw new Error("no rule");
    const items = [{ propertyId: finished, operator: "is-checked", value: "" }];
    const filter = { conjunction: "and" as const, items };
    const patch = { filter, color: "red" as const };
    app.dispatch(setColorRule.create({ viewId, ruleId: rule.id, patch }));
  }
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(app.store.getState(), () => ({ ok: true })),
    host,
  );
  return [...host.querySelectorAll(".database__row")].map((row) =>
    row.getAttribute("data-color"),
  );
}

describe("the table's rows", () => {
  it("carry the color of the first rule they match", () => {
    expect(tableRows(true)).toEqual(["red", null]);
  });

  it("carry no color when the view has no rule", () => {
    expect(tableRows(false)).toEqual([null, null]);
  });
});
