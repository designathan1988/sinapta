// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../../../state/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setViewGroupBy } from "../../group.commands.ts";
import { setViewSubGroupBy } from "../../sub-group.commands.ts";
import { setViewType } from "../../view-layout.commands.ts";

const select = (name: string, ids: readonly string[]) => ({
  name,
  type: "select",
  options: ids.map((id) => ({ id, name: id, color: "gray" })),
});

// A board by Stage, in lanes by Owner.
function rendered() {
  const app = createDatabaseApp(
    [select("Stage", ["todo", "done"]), select("Owner", ["ana", "bo"])],
    [
      ["a", "todo", "ana"],
      ["b", "done", "bo"],
    ],
  );
  const viewId = app.view().id;
  const [stage, owner] = app.propertyIds;
  if (stage === undefined || owner === undefined) throw new Error("setup");
  app.dispatch(setViewType.create({ viewId, viewType: "board" }));
  app.dispatch(setViewGroupBy.create({ viewId, propertyId: stage }));
  app.dispatch(setViewSubGroupBy.create({ viewId, propertyId: owner }));
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(app.store.getState(), (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent, viewId };
}

describe("a board with lanes", () => {
  it("shows the column headers once and a lane per sub-group", () => {
    const { host } = rendered();

    expect(host.querySelectorAll(".board__heads .board__header")).toHaveLength(
      3,
    );
    expect(
      [...host.querySelectorAll(".board__lane")].map((lane) =>
        lane.getAttribute("aria-label"),
      ),
    ).toEqual(["No Owner", "ana", "bo"]);
  });

  it("folds a lane from its header", () => {
    const { host, sent, viewId } = rendered();

    host
      .querySelector<HTMLElement>('[data-lane-key="bo"] .board__lane-head')
      ?.click();

    expect(sent.at(-1)).toEqual({
      type: "view.toggleSubGroupCollapsed",
      viewId,
      key: "bo",
    });
  });
});
