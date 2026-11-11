// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { setCalculation } from "./calculation.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { SELECT_OVERLAY } from "../../ui/select/index.ts";

function rendered(isGrouped = false, isOpen = false) {
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
  const overlay = isOpen
    ? { kind: SELECT_OVERLAY, anchorId: `calculate-${viewId}-${points}` }
    : null;
  const state = { ...built, ui: { ...built.ui, activeCell: null, overlay } };
  render(renderDatabase(state, dispatch), host);
  const footer = (propertyId: string) => {
    const cell = host.querySelector(
      `tfoot td[data-property-id="${propertyId}"]`,
    );
    if (cell === null) throw new Error("no footer");
    return cell;
  };
  return { host, sent, footer, points };
}

describe("the table's footer", () => {
  it("shows the column's calculation and its result", () => {
    const { footer, points } = rendered();

    const cell = footer(points);

    expect(cell.querySelector(".select")?.textContent).toContain("Sum");
    expect(cell.querySelector(".database__calc-value")?.textContent).toBe("13");
  });

  it("opens the calculations that fit, and chooses another or none", () => {
    const closed = rendered();
    closed.footer(closed.points).querySelector<HTMLElement>(".select")?.click();
    const open = rendered(false, true);
    const options = [
      ...open.host.querySelectorAll<HTMLElement>("[role=option]"),
    ];
    const pick = (label: string) =>
      options.find((option) => option.textContent.trim() === label)?.click();

    pick("Average");
    pick("None");

    expect(closed.sent).toHaveLength(1);
    expect(closed.sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: SELECT_OVERLAY },
    });
    expect(options[0]?.textContent.trim()).toBe("None");
    const changes = open.sent.filter(
      (command) => command.type === "view.setCalculation",
    );
    expect(changes).toEqual([
      expect.objectContaining({ propertyId: open.points, kind: "average" }),
      expect.objectContaining({ propertyId: open.points, kind: null }),
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
