// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { rendered } from "./view-settings-builder.ts";

describe("the view settings' data source rows, as Notion's", () => {
  it("follow Conditional color with Copy link to view, then the data source", () => {
    const { host } = rendered();

    const labels = [...host.querySelectorAll(".menu__label")].map((label) =>
      label.textContent.trim(),
    );
    const after = labels.slice(labels.indexOf("Conditional color"));

    expect(after.slice(0, 7)).toEqual([
      "Conditional color",
      "Copy link to view",
      "Source",
      "Edit properties",
      "Automations",
      "AI autofill",
      "Lock database",
    ]);
    expect(host.textContent).toContain("Data source settings");
  });

  it("open Source and Edit properties in their panels", () => {
    const { sent, row } = rendered();

    row("Source").click();
    row("Edit properties").click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.openOverlayPanel", panel: "source" }),
      expect.objectContaining({
        type: "ui.openOverlayPanel",
        panel: "properties",
      }),
    ]);
  });

  it("locks the database", () => {
    const { sent, row } = rendered();

    row("Lock database").click();

    expect(sent).toContainEqual(expect.objectContaining({ isLocked: true }));
  });
});
