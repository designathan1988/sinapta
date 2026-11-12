// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import {
  ruleAnchorId,
  VIEW_FILTER_RULE_OVERLAY,
} from "./filter-rule-anchor.ts";
import {
  VIEW_FILTER_ADD_OVERLAY,
  VIEW_SORT_PILL_OVERLAY,
} from "./view-pills.view.ts";
import { setViewFilter, sortByProperty } from "./view.commands.ts";

interface Rule {
  readonly property: "Due" | "Done" | "Stage";
  readonly operator: string;
  readonly value: string | null;
}

const NAMES = ["Due", "Done", "Stage"];

interface Rules {
  readonly sorts?: number;
  readonly filters?: number;
  // Rules given whole, in place of counted ones.
  readonly rules?: readonly Rule[];
  readonly conjunction?: "and" | "or";
}

// A database with Due and Done; the first sorts and filters asked for
// are set on its view.
function rendered(rules: Rules = {}) {
  const app = createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Done", type: "checkbox" },
      {
        name: "Stage",
        type: "select",
        options: [{ id: "done", name: "Done", color: "green" }],
      },
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
  const counted = ids
    .slice(0, rules.filters ?? 0)
    .map((propertyId) => ({ propertyId, operator: "isNotEmpty", value: null }));
  const items =
    rules.rules?.flatMap(({ property, operator, value }) => {
      const propertyId = ids[NAMES.indexOf(property)];
      return propertyId === undefined ? [] : [{ propertyId, operator, value }];
    }) ?? counted;
  app.dispatch(
    setViewFilter.create({
      viewId,
      filter: { conjunction: rules.conjunction ?? "and", items },
    }),
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
  return { host, sent, pills, holderId: app.databaseId };
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

  it("counts several sorts, and gives each rule joined by and a pill", () => {
    const { pills } = rendered({ sorts: 2, filters: 2 });

    expect(pills().map((pill) => pill.textContent.trim())).toEqual([
      "2 sorts",
      "Due",
      "Done",
      "Add filter",
    ]);
  });

  it("counts the rules of an advanced filter on one pill", () => {
    const { pills } = rendered({ filters: 2, conjunction: "or" });

    expect(pills().map((pill) => pill.textContent.trim())).toEqual([
      "2 rules",
      "Add filter",
    ]);
  });

  it("opens a rule from its pill, and the properties from Add filter", () => {
    const { sent, pills, holderId } = rendered({ filters: 2 });

    pills().forEach((pill) => {
      pill.click();
    });

    expect(sent.slice(-3)).toMatchObject([
      {
        type: "ui.openOverlay",
        overlay: {
          kind: VIEW_FILTER_RULE_OVERLAY,
          anchorId: ruleAnchorId(holderId, 0),
        },
      },
      {
        type: "ui.openOverlay",
        overlay: {
          kind: VIEW_FILTER_RULE_OVERLAY,
          anchorId: ruleAnchorId(holderId, 1),
        },
      },
      { type: "ui.openOverlay", overlay: { kind: VIEW_FILTER_ADD_OVERLAY } },
    ]);
  });

  it("shows a rule's value on its pill, as Notion's", () => {
    const label = (rule: Rule) =>
      rendered({ rules: [rule] })
        .pills()[0]
        ?.textContent.trim();

    expect(label({ property: "Stage", operator: "is", value: "done" })).toBe(
      "Stage: Done",
    );
    expect(
      label({ property: "Stage", operator: "is-not", value: "done" }),
    ).toBe("Stage: Is not Done");
    expect(label({ property: "Due", operator: "is-empty", value: null })).toBe(
      "Due: Is empty",
    );
    expect(label({ property: "Stage", operator: "is", value: null })).toBe(
      "Stage",
    );
  });
});
