// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { ViewType } from "../../model/index.ts";
import { addColorRule, setColorRule } from "./color-rules.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewType } from "./view-layout.commands.ts";

// "Done" ticked and "Open" not, in a view laid out as asked, whose rule
// colors ticked rows red.
function rendered(
  type: ViewType,
  target: "background" | "text" = "background",
) {
  const app = createDatabaseApp(
    [
      { name: "Finished", type: "checkbox" },
      { name: "Due", type: "date" },
    ],
    [
      ["Done", true, { start: "2026-11-13" }],
      ["Open", undefined, { start: "2026-11-13" }],
    ],
  );
  const viewId = app.view().id;
  const [finished] = app.propertyIds;
  if (finished === undefined) throw new Error("setup");
  app.dispatch(setViewType.create({ viewId, viewType: type }));
  app.dispatch(addColorRule.create({ viewId }));
  const rule = app.view().colorRules?.[0];
  if (rule === undefined) throw new Error("no rule");
  const items = [{ propertyId: finished, operator: "is-checked", value: "" }];
  const patch = { filter: { conjunction: "and" as const, items }, target };
  app.dispatch(setColorRule.create({ viewId, ruleId: rule.id, patch }));
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(app.store.getState(), () => ({ ok: true })),
    host,
  );
  return host;
}

function colorsOf(host: HTMLElement, selector: string) {
  return [...host.querySelectorAll(selector)].map((row) =>
    row.getAttribute("data-color"),
  );
}

describe("rows colored by the view's rules", () => {
  it("colors cards, list lines and calendar entries the same way", () => {
    expect(colorsOf(rendered("gallery"), ".row-card")).toContain("red");
    expect(colorsOf(rendered("list"), ".list__row")).toEqual(["red", null]);
    expect(colorsOf(rendered("calendar"), ".calendar__entry")).toContain("red");
  });

  it("marks a text color apart from a background", () => {
    expect(colorsOf(rendered("table", "text"), ".database__row")).toEqual([
      "red-text",
      null,
    ]);
  });
});
