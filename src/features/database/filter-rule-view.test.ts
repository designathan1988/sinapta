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
import { setViewFilter } from "./view.commands.ts";

// A view filtered by Notes contains "x" and Stage is Done, with the
// second rule's popover open.
function rendered() {
  const app = createDatabaseApp(
    [
      { name: "Notes", type: "text" },
      {
        name: "Stage",
        type: "select",
        options: [{ id: "done", name: "Done", color: "green" }],
      },
    ],
    [["A"]],
  );
  const [notes, stage] = app.propertyIds;
  if (notes === undefined || stage === undefined) throw new Error("none");
  const first = { propertyId: notes, operator: "contains", value: "x" };
  const second = { propertyId: stage, operator: "is", value: "done" };
  app.dispatch(
    setViewFilter.create({
      viewId: app.view().id,
      filter: { conjunction: "and", items: [first, second] },
    }),
  );
  const built = app.store.getState();
  const overlay = {
    kind: VIEW_FILTER_RULE_OVERLAY,
    anchorId: ruleAnchorId(app.databaseId, 1),
  };
  const state = { ...built, ui: { ...built.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const rule = host.querySelector<HTMLElement>(".database__rule");
  return { rule, sent, first, second };
}

describe("a filter rule opened from its pill", () => {
  it("names its property and shows its operator and value", () => {
    const { rule } = rendered();

    expect(rule?.querySelector(".database__rule-name")?.textContent).toBe(
      "Stage",
    );
    expect(rule?.textContent).toContain("Is");
    expect(rule?.textContent).toContain("Done");
  });

  it("deletes the rule and closes", () => {
    const { rule, sent, first } = rendered();
    const remove = rule?.querySelector<HTMLElement>(
      'button[aria-label="Remove filter"]',
    );

    remove?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setFilter",
        filter: { conjunction: "and", items: [first] },
      }),
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });
});
