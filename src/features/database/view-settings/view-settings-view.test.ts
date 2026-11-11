// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { rendered } from "./view-settings-builder.ts";

describe("the view settings", () => {
  it("lists the view's settings with their values, each opening its panel", () => {
    const { sent, row } = rendered();

    row("Layout").click();

    expect(row("Layout").querySelector(".menu__value")?.textContent).toBe(
      "Table",
    );
    expect(row("Group").querySelector(".menu__value")?.textContent).toBe(
      "None",
    );
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.openOverlayPanel", panel: "layout" }),
    ]);
  });

  it("renames the view from its name field", () => {
    const { host, sent, viewId } = rendered();
    const field = host.querySelector<HTMLInputElement>(".menu__name input");

    if (field) field.value = "Mine";
    field?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({ type: "view.rename", viewId, name: "Mine" }),
    ]);
  });

  it("changes the layout from its tiles", () => {
    const { host, sent } = rendered({ panel: "layout" });
    const tile = [
      ...host.querySelectorAll<HTMLElement>(".view-settings__tile"),
    ].find((item) => item.textContent.trim() === "Board");

    tile?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "view.setType", viewType: "board" }),
    ]);
  });

  it("groups by a property chosen from the properties that can group", () => {
    const { host, sent, row, due } = rendered({ panel: "group" });

    row("Due").click();

    const labels = [...host.querySelectorAll(".menu__label")].map((label) =>
      label.textContent.trim(),
    );
    expect(labels).not.toContain("Files");
    expect(sent).toEqual([
      expect.objectContaining({ type: "view.setGroupBy", propertyId: due }),
      expect.objectContaining({ type: "ui.openOverlayPanel", panel: "group" }),
    ]);
  });

  it("sets how groups show once grouped, and goes back after a choice", () => {
    const grouped = rendered({ panel: "group", grouped: true });

    grouped.row("Hide empty groups").click();
    grouped.row("Sort").click();
    const sorting = rendered({ panel: "group-sort", grouped: true });
    sorting.row("Reverse alphabetical").click();

    expect(grouped.sent).toEqual([
      expect.objectContaining({ options: { hideEmpty: true } }),
      expect.objectContaining({
        type: "ui.openOverlayPanel",
        panel: "group-sort",
      }),
    ]);
    expect(sorting.sent).toEqual([
      expect.objectContaining({ options: { sort: "descending" } }),
      expect.objectContaining({ type: "ui.openOverlayPanel", panel: "group" }),
    ]);
  });

  it("shows and hides properties from the visibility panel", () => {
    const { sent, row, due } = rendered({ panel: "properties" });

    row("Due").click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "view.togglePropertyHidden",
        propertyId: due,
      }),
    ]);
  });

  it("sets a board's cards in its layout panel", () => {
    const { sent, row } = rendered({ panel: "layout", board: true });

    row("Color columns").click();
    row("Card size").click();

    expect(sent).toEqual([
      expect.objectContaining({ options: { colorColumns: false } }),
      expect.objectContaining({
        type: "ui.openOverlayPanel",
        panel: "card-size",
      }),
    ]);
  });
});
