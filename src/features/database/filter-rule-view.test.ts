// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp, toPropertyId } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import {
  ruleAnchorId,
  VIEW_FILTER_RULE_OVERLAY,
} from "./filter-rule-anchor.ts";
import { renderRuleHead } from "./filter-rule-head.view.ts";
import type { FieldChange } from "./filter-row.view.ts";
import { setViewFilter } from "./view.commands.ts";

// A view filtered by Notes contains "x" and Stage is Done, with the
// second rule's popover open (and, when asked, one of its lists).
function rendered(child?: string, index = 1) {
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
    anchorId: ruleAnchorId(app.databaseId, index),
    ...(child !== undefined && { children: [{ anchorId: child }] }),
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

function itemNamed(label: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("[role=menuitem]")].find(
    (item) => item.textContent.includes(label),
  );
}

describe("a filter rule opened from its pill", () => {
  it("heads with the property's name and the condition as Notion writes it", () => {
    const { rule } = rendered();
    const head = rule?.querySelector(".database__rule-head");

    expect(head?.querySelector(".database__rule-name")?.textContent).toBe(
      "Stage",
    );
    expect(head?.textContent).toContain("is");
    expect(head?.textContent).not.toContain("Is");
    expect(rule?.textContent).toContain("Done");
    expect(
      head?.querySelector("#select-filter-rule-1-more")?.textContent,
    ).toContain("More filter actions");
  });

  it("filters as the value is typed, as Notion's", () => {
    const { rule, sent, first, second } = rendered(undefined, 0);
    const field = rule?.querySelector<HTMLInputElement>('[data-field="value"]');
    if (field === null || field === undefined) throw new Error("no field");

    field.value = "abc";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toContainEqual(
      expect.objectContaining({
        filter: {
          conjunction: "and",
          items: [{ ...first, value: "abc" }, second],
        },
      }),
    );
  });

  it("lists Delete filter and Add to advanced filter behind its …", () => {
    rendered("filter-rule-1-more");

    expect(itemNamed("Delete filter")).toBeDefined();
    expect(itemNamed("Add to advanced filter")).toBeDefined();
  });

  it("deletes the rule from Delete filter, and closes", () => {
    const { sent, first } = rendered("filter-rule-1-more");

    itemNamed("Delete filter")?.click();

    expect(sent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "view.setFilter",
          filter: { conjunction: "and", items: [first] },
        }),
        expect.objectContaining({ type: "ui.closeOverlay" }),
      ]),
    );
  });

  it("moves the rule into the advanced filter, kept, and opens it", () => {
    const { sent, first, second } = rendered("filter-rule-1-more");

    itemNamed("Add to advanced filter")?.click();

    expect(sent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "view.setFilter",
          filter: {
            conjunction: "and",
            items: [first, { conjunction: "and", items: [second] }],
          },
        }),
      ]),
    );
    const opened = sent.find((command) => command.type === "ui.openOverlay");
    expect(JSON.stringify(opened)).toContain('"kind":"view-filter-pill"');
  });
});

describe("a rollup rule's head", () => {
  const property = {
    id: toPropertyId("p-roll"),
    name: "Stages",
    type: "rollup",
  };
  const operator = (id: string, label: string) => ({
    id,
    label,
    needsOperand: true,
    test: () => true,
  });
  const operators = ["any", "none", "every"].flatMap((quantifier) => [
    operator(`${quantifier}:is`, "Is"),
    operator(`${quantifier}:is-not`, "Is not"),
  ]);

  function head(child?: string) {
    const changes: FieldChange[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    const overlay = {
      kind: VIEW_FILTER_RULE_OVERLAY,
      anchorId: "rule",
      ...(child !== undefined && { children: [{ anchorId: child }] }),
    };
    render(
      renderRuleHead(
        {
          id: "rule",
          filter: {
            propertyId: property.id,
            operator: "any:is",
            value: "done",
          },
          property,
          operators,
          change: (change) => changes.push(change),
          remove: () => undefined,
          toAdvanced: () => undefined,
        },
        { overlay, dispatch: () => ({ ok: true }) },
      ),
      host,
    );
    return { host, changes };
  }

  it("chooses Any first, then the condition among the target's", () => {
    const { host } = head();
    const texts = [...host.querySelectorAll(".select")].map((item) =>
      item.textContent.trim(),
    );

    expect(texts[0]).toContain("Any");
    expect(texts[1]).toContain("is");
  });

  it("keeps the condition when Any becomes Every", () => {
    const { changes } = head("rule-quantifier");

    [...document.querySelectorAll<HTMLElement>("[role=option]")]
      .find((item) => item.textContent.trim() === "Every")
      ?.click();

    expect(changes).toEqual([{ field: "operator", value: "every:is" }]);
  });

  it("lists only the conditions under the chosen quantifier", () => {
    head("rule-operator");

    const labels = [
      ...document.querySelectorAll<HTMLElement>("[role=option]"),
    ].map((item) => item.textContent.trim());

    expect(labels).toEqual(["is", "is not"]);
  });
});
