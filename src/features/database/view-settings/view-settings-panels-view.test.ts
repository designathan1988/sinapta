// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { rendered } from "./view-settings-builder.ts";

describe("the view settings' sorts", () => {
  it("opens a new sort from the Sort row while the view has none", () => {
    const empty = rendered();
    const sorted = rendered({ sorted: true });

    empty.row("Sort").click();
    sorted.row("Sort").click();

    expect(sorted.row("Sort").querySelector(".menu__value")?.textContent).toBe(
      "1",
    );
    expect([...empty.sent, ...sorted.sent]).toEqual([
      expect.objectContaining({ panel: "sort-add" }),
      expect.objectContaining({ panel: "sort" }),
    ]);
  });

  it("lists the properties to sort by, searchable, and adds a sort", () => {
    const { host, sent, row, due } = rendered({ panel: "sort-add" });

    row("Due").click();

    expect(
      host.querySelector<HTMLInputElement>(".menu__search input")?.placeholder,
    ).toBe("Sort by…");
    expect(row("Name").querySelector(".icon")).not.toBeNull();
    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.sortBy",
        propertyId: due,
        direction: "ascending",
        keepOthers: true,
      }),
      expect.objectContaining({ type: "ui.openOverlayPanel", panel: "sort" }),
    ]);
  });

  it("lists each sort with its property, its direction and Remove", () => {
    const { host, sent } = rendered({ panel: "sort", sorted: true });
    const sorts = host.querySelectorAll(".view-settings__sort");

    host
      .querySelector<HTMLElement>(
        ".view-settings__sort button[aria-label='Remove sort']",
      )
      ?.click();

    expect(sorts).toHaveLength(1);
    expect(sorts[0]?.textContent).toContain("Due");
    expect(sorts[0]?.textContent).toContain("Descending");
    expect(sent).toEqual([
      expect.objectContaining({ type: "view.setSorts", sorts: [] }),
    ]);
  });

  it("adds another sort and deletes them all", () => {
    const { sent, row } = rendered({ panel: "sort", sorted: true });

    row("Add sort").click();
    row("Delete sort").click();

    expect(sent).toEqual([
      expect.objectContaining({ panel: "sort-add" }),
      expect.objectContaining({ type: "view.setSorts", sorts: [] }),
      expect.objectContaining({ type: "ui.openOverlayPanel" }),
    ]);
  });
});

describe("a calendar's layout settings", () => {
  it("shows the calendar as month or week, with or without weekends", () => {
    const { host, sent, row } = rendered({ panel: "layout", calendar: true });

    row("Show weekends").click();
    row("Start week on Monday").click();

    expect(
      row("Show calendar as").querySelector(".menu__value")?.textContent,
    ).toBe("Month");
    expect(row("Show weekends").getAttribute("aria-checked")).toBe("true");
    expect(host.querySelector(".menu")).not.toBeNull();
    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setCalendarOptions",
        options: { showWeekends: false },
      }),
      expect.objectContaining({
        type: "view.setCalendarOptions",
        options: { weekStartsOn: 1 },
      }),
    ]);
  });
});

describe("a timeline's layout settings", () => {
  it("shows the timeline by a date, with or without the table", () => {
    const { sent, row } = rendered({ panel: "layout", timeline: true });

    row("Show table").click();

    expect(
      row("Show timeline by").querySelector(".menu__value")?.textContent,
    ).toBe("Due");
    expect(row("Show table").getAttribute("aria-checked")).toBe("true");
    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.setTimelineOptions",
        options: { showTable: false },
      }),
    ]);
  });
});

describe("a chart's layout settings", () => {
  it("shows the chart's type and axes, each opening its choices", () => {
    const { row } = rendered({ panel: "layout", chart: true });

    expect(row("Chart type").querySelector(".menu__value")?.textContent).toBe(
      "Vertical bar",
    );
    expect(row("X axis").querySelector(".menu__value")?.textContent).toBe(
      "Due",
    );
    expect(row("Y axis").querySelector(".menu__value")?.textContent).toBe(
      "Count",
    );
  });

  it("chooses the chart's type", () => {
    const { sent, row } = rendered({ panel: "chart-kind", chart: true });

    row("Donut").click();

    expect(sent[0]).toMatchObject({
      type: "view.setChartOptions",
      options: { kind: "donut" },
    });
  });
});
