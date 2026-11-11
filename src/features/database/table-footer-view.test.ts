// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { setCalculation } from "./calculation.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewGroupBy } from "./group.commands.ts";

function rendered(isGrouped = false) {
  const app = createDatabaseApp(
    [
      { name: "Points", type: "number" },
      {
        name: "Stage",
        type: "select",
        options: [
          { id: "a", name: "A", color: "gray" },
          { id: "b", name: "B", color: "blue" },
        ],
      },
    ],
    [
      ["one", 1, "a"],
      ["two", 2, "a"],
      ["ten", 10, "b"],
    ],
  );
  const viewId = app.view().id;
  const [points, stage] = app.propertyIds;
  if (points === undefined || stage === undefined) throw new Error("setup");
  app.dispatch(
    setCalculation.create({ viewId, propertyId: points, kind: "sum" }),
  );
  if (isGrouped) {
    app.dispatch(setViewGroupBy.create({ viewId, propertyId: stage }));
  }
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, activeCell: null } };
  render(renderDatabase(state, dispatch), host);
  const footer = (propertyId: string) => {
    const select = host.querySelector(
      `tfoot select[data-property-id="${propertyId}"]`,
    );
    if (!(select instanceof HTMLSelectElement)) throw new Error("no footer");
    return select;
  };
  return { host, sent, footer, points };
}

describe("the table's footer", () => {
  it("shows the column's calculation and its result", () => {
    const { footer, points } = rendered();

    const select = footer(points);

    // happy-dom does not select an option whose attribute is set later.
    const chosen = select.querySelector("option[selected]");
    expect(chosen?.textContent.trim()).toBe("Sum");
    expect(select.closest("td")?.textContent).toContain("13");
  });

  it("chooses another calculation, or none", () => {
    const { footer, sent, points } = rendered();
    const select = footer(points);

    select.value = "average";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setCalculation",
        propertyId: points,
        kind: "average",
      }),
      expect.objectContaining({ propertyId: points, kind: null }),
    ]);
  });

  it("works out each group's calculation under the group", () => {
    const { host, points } = rendered(true);

    const results = ["a", "b"].map((key) =>
      host
        .querySelector(
          `[data-group-add="${key}"] [data-property-id="${points}"]`,
        )
        ?.textContent.trim(),
    );

    expect(results).toEqual(["3", "10"]);
  });
});
