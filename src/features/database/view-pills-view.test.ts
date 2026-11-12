// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import {
  VIEW_FILTER_ADD_OVERLAY,
  VIEW_FILTER_PILL_OVERLAY,
  VIEW_SORT_PILL_OVERLAY,
} from "./view-pills.view.ts";
import { setViewFilter, sortByProperty } from "./view.commands.ts";

interface Rules {
  readonly sorts?: number;
  readonly filters?: number;
}

// A database with Due and Done; the first sorts and filters asked for
// are set on its view.
function rendered(rules: Rules = {}) {
  const app = createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Done", type: "checkbox" },
    ],
    [["Write"]],
  );
  const viewId = app.view().id;
  const ids = app.propertyIds;
  for (const propertyId of ids.slice(0, rules.sorts ?? 0)) {
    app.dispatch(
      sortByProperty.create({
        viewId,
        propertyId,
        direction: "descending",
        keepOthers: true,
      }),
    );
  }
  const items = ids
    .slice(0, rules.filters ?? 0)
    .map((propertyId) => ({ propertyId, operator: "isNotEmpty", value: null }));
  app.dispatch(
    setViewFilter.create({ viewId, filter: { conjunction: "and", items } }),
  );
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
  const pills = () => [
    ...host.querySelectorAll<HTMLElement>(".database__pills button"),
  ];
  return { host, sent, pills };
}

describe("the row of sorts and filters", () => {
  it("is not there while the view neither sorts nor filters", () => {
    const { host } = rendered();

    expect(host.querySelector(".database__pills")).toBeNull();
  });

  it("names the one sort, and opens the sorts from its pill", () => {
    const { sent, pills } = rendered({ sorts: 1 });

    pills()[0]?.click();

    expect(pills()[0]?.textContent.trim()).toBe("Due");
    expect(sent.at(-1)).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: VIEW_SORT_PILL_OVERLAY },
    });
  });

  it("counts several sorts and several filter rules", () => {
    const { pills } = rendered({ sorts: 2, filters: 2 });

    expect(pills().map((pill) => pill.textContent.trim())).toEqual([
      "2 sorts",
      "2 rules",
      "Add filter",
    ]);
  });

  it("opens the filters from the filter pill and from Add filter", () => {
    const { sent, pills } = rendered({ filters: 1 });

    pills().forEach((pill) => {
      pill.click();
    });

    expect(pills().map((pill) => pill.textContent.trim())).toEqual([
      "Due",
      "Add filter",
    ]);
    expect(sent.slice(-2)).toMatchObject([
      { type: "ui.openOverlay", overlay: { kind: VIEW_FILTER_PILL_OVERLAY } },
      { type: "ui.openOverlay", overlay: { kind: VIEW_FILTER_ADD_OVERLAY } },
    ]);
  });
});
