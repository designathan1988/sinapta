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

// A view filtered by Due relative to today, its rule open, with one of
// its lists open when asked.
function rendered(operand: string, child?: string, operator = "relative") {
  const app = createDatabaseApp([{ name: "Due", type: "date" }], [["A"]]);
  const [due] = app.propertyIds;
  if (due === undefined) throw new Error("none");
  const rule = { propertyId: due, operator, value: operand };
  app.dispatch(
    setViewFilter.create({
      viewId: app.view().id,
      filter: { conjunction: "and", items: [rule] },
    }),
  );
  const built = app.store.getState();
  const overlay = {
    kind: VIEW_FILTER_RULE_OVERLAY,
    anchorId: ruleAnchorId(app.databaseId, 0),
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
  return { host, sent, rule };
}

function option(label: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("[role=option]")].find(
    (item) => item.textContent.trim() === label,
  );
}

describe("a date filter's popover", () => {
  it("is Notion's wider date popover (260 px, n69-date-filter-measure)", () => {
    const { host } = rendered("this:week");

    expect(
      host.querySelector(".database__rule")?.getAttribute("data-size"),
    ).toBe("date");
  });
});

describe("the operand of a date filter relative to today", () => {
  it("draws Start date, the condition, two selects, the month and the note", () => {
    const { host } = rendered("this:week");
    const popover = host.querySelector(".database__rule");

    expect(
      popover?.querySelector(".database__rule-head")?.textContent,
    ).toContain("Start date");
    expect(popover?.textContent).toContain("is relative to today");
    const parts = popover?.querySelectorAll(
      ".database__relative-parts .select",
    );
    expect([...(parts ?? [])].map((part) => part.textContent.trim())).toEqual([
      expect.stringContaining("This"),
      expect.stringContaining("week"),
    ]);
    expect(
      popover?.querySelector(".date-picker__day[data-in-range]"),
    ).not.toBeNull();
    expect(popover?.textContent).toContain(
      "Filter will update with the current date",
    );
  });

  it("chooses Next, then Month, as next:month", () => {
    const first = rendered("this:week", "filter-0-direction");
    option("Next")?.click();
    expect(first.sent).toContainEqual(
      expect.objectContaining({
        type: "view.setFilter",
        filter: {
          conjunction: "and",
          items: [{ ...first.rule, value: "next:week" }],
        },
      }),
    );

    const second = rendered("next:week", "filter-0-unit");
    option("month")?.click();
    expect(second.sent).toContainEqual(
      expect.objectContaining({
        type: "view.setFilter",
        filter: {
          conjunction: "and",
          items: [{ ...second.rule, value: "next:month" }],
        },
      }),
    );
  });

  it("tests a range's end once End date is chosen", () => {
    const { sent, rule } = rendered("this:week", "filter-rule-0-date-end");

    option("End date")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        filter: { conjunction: "and", items: [{ ...rule, dateEnd: "end" }] },
      }),
    );
  });

  it("takes Is between's two days as typed in its fields", () => {
    const { host, sent, rule } = rendered("2026-11-10..", undefined, "between");
    const [first, last] = host.querySelectorAll<HTMLInputElement>(
      ".database__between input",
    );

    // The days read as the rest of the app writes them, not the browser's.
    expect(first?.type).toBe("text");
    expect(first?.value).toBe("Nov 10, 2026");
    if (last !== undefined) last.value = "Nov 12, 2026";
    last?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toContainEqual(
      expect.objectContaining({
        filter: {
          conjunction: "and",
          items: [{ ...rule, value: "2026-11-10..2026-11-12" }],
        },
      }),
    );
  });
});

// A view filtered by Done, its rule open, as Notion's checkbox filter.
function checkboxRule(value: string) {
  const app = createDatabaseApp([{ name: "Done", type: "checkbox" }], [["A"]]);
  const [done] = app.propertyIds;
  if (done === undefined) throw new Error("none");
  const viewId = app.view().id;
  const rule = { propertyId: done, operator: "is", value };
  app.dispatch(
    setViewFilter.create({
      viewId,
      filter: { conjunction: "and", items: [rule] },
    }),
  );
  const built = app.store.getState();
  const overlay = {
    kind: VIEW_FILTER_RULE_OVERLAY,
    anchorId: ruleAnchorId(app.databaseId, 0),
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase({ ...built, ui: { ...built.ui, overlay } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent };
}

describe("the operand of a checkbox filter", () => {
  it("lists Unchecked then Checked under the condition, as Notion's", () => {
    const { host, sent } = checkboxRule("");
    const rows = [
      ...host.querySelectorAll<HTMLElement>(".database__rule [role=option]"),
    ];

    expect(rows.map((row) => row.textContent.trim())).toEqual([
      "Unchecked",
      "Checked",
    ]);
    rows[1]?.click();

    expect(JSON.stringify(sent.at(-1))).toContain('"value":"checked"');
  });

  it("marks the value chosen", () => {
    const { host } = checkboxRule("unchecked");
    const chosen = host.querySelector(
      ".database__rule [role=option][aria-selected=true]",
    );

    expect(chosen?.textContent.trim()).toBe("Unchecked");
  });

  it("is a narrow popover whose first value takes the keys, as Notion's", async () => {
    const { host } = checkboxRule("");
    const popover = host.querySelector(".database__rule");
    await Promise.resolve();

    expect(popover?.hasAttribute("data-listed")).toBe(true);
    expect(popover?.hasAttribute("data-size")).toBe(false);
    expect(document.activeElement?.textContent.trim()).toBe("Unchecked");
  });
});
